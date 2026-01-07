// ═══════════════════════════════════════════════════════════════
// INTERACTION CREATE EVENT
// ═══════════════════════════════════════════════════════════════
const {
    Events,
    MessageFlags,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder
} = require('discord.js');
const { applyChannelId, programmerRole, supportRole } = require('../config.json');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // ─────────────────────────────────────────────────────────────
        // Slash Commands Handler
        // ─────────────────────────────────────────────────────────────
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (err) {
                console.error('Command Execution Error:', err);
                const errorMessage = {
                    content: '**<:Warnings:1449127476490932357> حدث خطأ أثناء تنفيذ الملف!**',
                    flags: MessageFlags.Ephemeral
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage).catch(() => { });
                } else {
                    await interaction.reply(errorMessage).catch(() => { });
                }
            }
        }

        const { customId, message } = interaction;

        // ─────────────────────────────────────────────────────────────
        // Button & Select Menu Handler
        // ─────────────────────────────────────────────────────────────
        if (interaction.isButton() || interaction.isStringSelectMenu()) {
            // Apply Start Button
            if (customId === 'apply_start') {
                const { Routes } = require('discord.js');

                await interaction.client.rest.post(Routes.interactionCallback(interaction.id, interaction.token), {
                    body: {
                        type: 9, // Modal
                        data: {
                            title: 'طلب انضمام طاقم اداري',
                            custom_id: 'apply_modal_full',
                            flags: 64 | 32768,
                            components: [
                                {
                                    type: 18, // Label Component
                                    label: 'القسم المطلوب',
                                    component: { // Use 'component' singular for Label wrapping
                                        type: 3, // String Select
                                        custom_id: 'dept',
                                        placeholder: 'اختر القسم المطلوب...',
                                        options: [
                                            { label: 'مبرمج', description: 'التقديم لقسم البرمجة', value: 'مبرمج' },
                                            { label: 'دعم فني', description: 'التقديم لقسم الدعم الفني', value: 'دعم فني' },
                                        ],
                                    }
                                },
                                {
                                    type: 18,
                                    label: 'اسمك الحقيقي',
                                    component: { type: 4, custom_id: 'name', style: 1, required: true }
                                },
                                {
                                    type: 18,
                                    label: 'كم عمرك؟',
                                    component: { type: 4, custom_id: 'age', style: 1, required: true }
                                },
                                {
                                    type: 18,
                                    label: 'من وين؟',
                                    component: { type: 4, custom_id: 'location', style: 1, required: true }
                                },
                                {
                                    type: 18,
                                    label: 'خبرتك',
                                    component: { type: 4, custom_id: 'exp', style: 2, required: true }
                                }
                            ]
                        }
                    }
                });
                return;
            }

            // Accept/Reject Button (Admin Side)
            if (customId.startsWith('apply_accept_') || customId.startsWith('apply_reject_')) {
                const parts = customId.split('_');
                const action = parts[1];
                const dept = parts[2];
                const applicantId = parts[3];

                if (action === 'accept') {
                    const member = await interaction.guild.members.fetch(applicantId).catch(() => null);
                    if (member) {
                        const roleId = dept === 'مبرمج' ? programmerRole : supportRole;
                        if (roleId && roleId !== "YOUR_ROLE_ID") {
                            await member.roles.add(roleId).catch(e => console.error('Role Error:', e));
                        }
                        await member.send(`✅ تم قبولك في طاقم عمل **${interaction.guild.name}** لقسم **${dept}**!`).catch(() => { });
                    }

                    // Update Log Message (Container V2 Support)
                    let components = message.components;
                    if (components[0]?.type === 17) { // Container
                        const container = JSON.parse(JSON.stringify(components[0]));
                        const titleComp = container.components.find(c => c.type === 10 && c.content.includes('طلب انضمام'));
                        if (titleComp) titleComp.content = `## ✅ [تم القبول] - ${dept}`;

                        return interaction.update({
                            components: [{
                                type: 17,
                                components: container.components.filter(c => c.type !== 1) // Remove ActionRow
                            }]
                        });
                    }

                    // Fallback for Embeds
                    const embed = EmbedBuilder.from(interaction.message.embeds[0])
                        .setColor('#43b581')
                        .setTitle('✅ [تم القبول]');

                    return interaction.update({
                        embeds: [embed],
                        components: []
                    });
                } else {
                    const modal = new ModalBuilder()
                        .setCustomId(`apply_reject_modal_${dept}_${applicantId}`)
                        .setTitle('سبب الرفض');

                    const input = new TextInputBuilder()
                        .setCustomId('reason')
                        .setLabel('اكتب سبب الرفض')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true);

                    modal.addComponents(new ActionRowBuilder().addComponents(input));
                    return interaction.showModal(modal);
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // Modal Submit Handler
        // ─────────────────────────────────────────────────────────────
        if (interaction.isModalSubmit()) {
            const { fields, user, guild } = interaction;

            // Application Form Submit
            if (customId === 'apply_modal_full') {
                const dept = fields.getTextInputValue('dept') || 'غير محدد'; // Because StringSelect in Modal is new/experimental in API V2
                const name = fields.getTextInputValue('name');
                const age = fields.getTextInputValue('age');
                const loc = fields.getTextInputValue('location');
                const exp = fields.getTextInputValue('exp');

                const logChannel = await guild.channels.fetch(applyChannelId).catch(() => null);
                if (!logChannel) return interaction.reply({ content: '❌ لا يمكن العثور على قناة السجلات.', flags: 64 });

                // Constructing the Container V2 message
                await logChannel.send({
                    flags: 64 | 32768, // IsComponentsV2 + Container Flag
                    components: [
                        {
                            type: 17, // Container
                            components: [
                                {
                                    type: 10, // TextDisplay
                                    content: `**طلب انضمام جديد من <@${user.id}>**`
                                },
                                { type: 14 }, // Separator
                                {
                                    type: 10,
                                    content: `## 📋 طلب انضمام جديد - ${dept}`
                                },
                                { type: 14 }, // Separator
                                {
                                    type: 10,
                                    content: `**👤 الأسم:** ${name}\n**🎂 العمر:** ${age}\n**📍 من وين:** ${loc}\n**💼 القسم:** ${dept}\n\n**📝 الخبرة:**\n${exp}`
                                },
                                {
                                    type: 1, // Action Row
                                    components: [
                                        {
                                            type: 2,
                                            style: 3,
                                            label: 'قبول',
                                            custom_id: `apply_accept_${dept}_${user.id}`
                                        },
                                        {
                                            type: 2,
                                            style: 4,
                                            label: 'رفض',
                                            custom_id: `apply_reject_${dept}_${user.id}`
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                });

                return interaction.reply({ content: '✅ تم إرسال طلبك بنجاح للمراجعة.', flags: 64 });
            }

            // Reject Reason Submit
            if (customId.startsWith('apply_reject_modal_')) {
                const dept = customId.split('_')[3];
                const applicantId = customId.split('_')[4];
                const reason = fields.getTextInputValue('reason');

                const applicant = await client.users.fetch(applicantId).catch(() => null);
                if (applicant) {
                    await applicant.send(`❌ تم رفض طلب انضمامك لقسم **${dept}** في **${guild.name}**\n**السبب:** ${reason}`).catch(() => { });
                }

                // Update Log Message
                if (message && message.components[0]?.type === 17) {
                    const container = JSON.parse(JSON.stringify(message.components[0]));
                    const titleComp = container.components.find(c => c.type === 10 && c.content.includes('طلب انضمام'));
                    if (titleComp) titleComp.content = `## ❌ [تم الرفض] - ${dept}`;

                    container.components.push({ type: 14 });
                    container.components.push({
                        type: 10,
                        content: `**⚠️ سبب الرفض:** ${reason}`
                    });

                    return interaction.update({
                        components: [{
                            type: 17,
                            components: container.components.filter(c => c.type !== 1)
                        }]
                    });
                }

                const embed = interaction.message.embeds[0] ? EmbedBuilder.from(interaction.message.embeds[0]) : null;
                if (embed) {
                    embed.setColor('#f04747').setTitle('❌ [تم الرفض]').addFields({ name: 'سبب الرفض', value: reason });
                    return interaction.update({ embeds: [embed], components: [] });
                }

                return interaction.update({ content: `❌ تم الرفض لقسم ${dept}. السبب: ${reason}`, components: [] });
            }
        }
    }
};
