const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-apply')
        .setDescription('Setup administrative application system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // إرسال الرسالة إلى القناة مباشرة لتكون دائمة
        await interaction.channel.send({
            flags: 64 | 32768, // IsComponentsV2 + Container Flag (حسب القواعد المطلوبة)
            components: [
                {
                    type: 17, // Container Component
                    components: [
                        {
                            type: 10, // Text Display Component (Title)
                            content: '# نظام التقديم الإداري 💼'
                        },
                        {
                            type: 10, // Text Display Component (Description)
                            content: `أهلاً بك في نظام التقديم لشركة **Cyber Shadow**.
يرجى الضغط على الزر أدناه لاختيار القسم الذي ترغب بالانضمام إليه وبدء طلبك.`
                        },
                        {
                            type: 1, // Action Row
                            components: [
                                {
                                    type: 2, // Button
                                    style: 1, // Primary
                                    label: 'تقديم اداري',
                                    custom_id: 'apply_start'
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        // رد مخفي لتجنب خطأ "Interaction has already been acknowledged"
        await interaction.reply({
            content: '✅ تم إرسال قائمة التقديم بنجاح!',
            flags: 64
        });
    },
};
