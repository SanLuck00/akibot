const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

client.once('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {

  // ================= BAN SYSTEM =================
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'ban') {

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return interaction.reply({ content: "❌ No tienes permiso.", ephemeral: true });
      }

      const user = interaction.options.getUser('usuario');
      const reason = interaction.options.getString('razon') || "Sin razón";

      const member = interaction.guild.members.cache.get(user.id);

      if (!member) {
        return interaction.reply({ content: "Usuario no encontrado.", ephemeral: true });
      }

      await member.ban({ reason });

      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("🔨 Usuario Baneado")
        .addFields(
          { name: "Usuario", value: `${user.tag}` },
          { name: "Staff", value: `${interaction.user.tag}` },
          { name: "Razón", value: reason }
        )
        .setTimestamp();

      interaction.reply({ embeds: [embed] });
    }
  }

  // ================= TICKET SYSTEM =================
  if (interaction.isButton()) {

    if (interaction.customId === "crear_ticket") {

      const canal = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: ['ViewChannel'],
          },
          {
            id: interaction.user.id,
            allow: ['ViewChannel', 'SendMessages'],
          }
        ]
      });

      const cerrarBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("cerrar_ticket")
          .setLabel("Cerrar Ticket")
          .setStyle(ButtonStyle.Danger)
      );

      canal.send({
        content: `🎟 Ticket creado por <@${interaction.user.id}>`,
        components: [cerrarBtn]
      });

      interaction.reply({ content: `✅ Ticket creado: ${canal}`, ephemeral: true });
    }

    if (interaction.customId === "cerrar_ticket") {
      interaction.channel.delete();
    }
  }

});

// Registrar comandos slash automáticamente
client.on('ready', async () => {
  const commands = [
    new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Banea a un usuario')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Usuario a banear')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('razon')
          .setDescription('Razón del baneo'))
  ].map(command => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("Comandos registrados.");
});

client.login(TOKEN);
