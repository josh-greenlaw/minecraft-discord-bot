import { Command, command, param, params } from 'clime';
import { MessageEmbed } from 'discord.js';
import { SecurityLevel, SecurityService } from '../../Services/security-service';
import { PlotClaimOptions } from './default';
import { DiscordCommandContext } from '../../Services/discord-command-context';
import { MSSqlRepository } from '../../Services/mssql-repository';

export const brief = 'List Plots';
export const description =
    'List all plots for the specified user.';

export const minimumSecurityLevel = SecurityLevel.Player;

@command()
export default class extends Command {
    async execute(
        @param({
            type: String,
            description: 'X coordinate',
            required: true
        })
        xCoord: number,
        @param({
            type: String,
            description: 'Z coordinate',
            required: true
        })
        zCoord: number,
        @param({
            type: String,
            description: 'Optional, Realm name',
            required: false
        })
        realmName: string,
        options:PlotClaimOptions,
        context:DiscordCommandContext
    ) {
        var embed = new MessageEmbed()
        embed.title = "Claim Plot";
        //embed.fields.push({ name: "Coordinates", value: "X: " + xCoord + ", Z: " + zCoord });

        if (options.owner || options.shape || options.size) {
            var secLvl = SecurityService.getUserSecurityLevel(context.message,context.realmSettings);
            
            if (secLvl < SecurityLevel.Moderator) {
                throw new Error ("Only moderators or admins can use plot overrides.");
            }
        }
        
        if (!options.owner) {
            if (context.message.member) {
                options.owner = context.message.member.id;
            } else {
                throw new Error ("Somehow no one sent this message. Spoooooky!");
            }
        }

        if (!options.shape) {
            options.shape = context.realmSettings.defaultPlotShape;
        }

        if (!options.size) {
            options.size = context.realmSettings.defaultPlotSizeMeters;
        }

        if (!realmName) {
            realmName = context.realmSettings.defaultRealmName;
        }

        if (context.message.guild) {
            var repo = new MSSqlRepository();

            var settings = await repo.getRealmSettings (context.message.guild.id,
                                                        realmName,
                                                        options.owner);

            var plots = await repo.getPlotsByOwnerAndRealm (context.message.guild.id,
                                                            realmName,
                                                            options.owner);
            
            var overlap = await repo.checkForPlotIntersect (context.message.guild.id,
                                                            realmName,
                                                            options.shape,
                                                            xCoord,
                                                            zCoord,
                                                            options.size);
            
            var canClaim = true;

            if (plots.items.length >= settings.maximumPlayerPlots) {
                canClaim = false;
                embed.fields.push ({name:"Attempt", value:"Maximum number of plots exceeded!"});
            }

            if (overlap) {
                canClaim = false;
                embed.fields.push ({name:"Attempt", value:"This plot would overlap with another!"});
            }

            if (canClaim) {
                await repo.insertPlot (context.message.guild.id,
                                realmName,
                                options.owner,
                                xCoord,
                                zCoord,
                                options.shape,
                                options.size,
                                options.notes)

                embed.fields.push ({name:"Attempt", value:"Success"});
            }
        }

        return embed;
    }
}