import { Command, command, param, params, metadata, option, Options } from 'clime';
import { MessageEmbed } from 'discord.js';
import { SecurityLevel } from '../../Services/security-service';
import { DiscordCommandContext } from '../../Services/discord-command-context';
import { MSSqlRepository } from '../../Services/mssql-repository';
import { PlotView, PlotViewItem } from '../../Models/plot-view';

export const brief = 'Plot tools';
export const description =
    'This is a set of commands relating to the management and lookup of plots. Calling without any arguments will return your current plots';

export const minimumSecurityLevel = SecurityLevel.Player;

export class PlotClaimOptions extends Options {
    @option({
        flag: 'o',
        description: 'Moderator override - you can add plots for other players or groups',
    })
    owner?: string;

    @option({
        flag: 's',
        description: 'Moderator override - you can specify a plot shape',
    })
    shape?: string;
    
    @option({
        flag: 'i',
        description: 'Moderator override - you can specify a plot size',
    })
    size?: number;

    @option({
        flag: 'n',
        description: 'Any notes that you would like to add (available to anyone)',
    })
    notes?: string;
}

export class PlotViewOptions extends Options{
    @option({
        flag: 'c',
        description: 'Search via coordinates instead of player. Enter as "Radius, x coord, z coord" (e.g. "500,0,0")'
    })
    coordinateSearch?: string;

    @option({
        flag: 'a',
        description: 'List all plots on the given realm',
        toggle: true
    })
    all?: boolean;
}

@command()
export default class extends Command {
    async execute(
        @param({
            type: String,
            description: 'The user or group to look up, if the group has spaces in the name then surround it with quotation marks (")',
            required: false
        })
        owner: string,
        @param({
            type: String,
            description: 'The realm to look in, if the name has spaces in it, then surround it with quotation marks (")',
            required: false
        })
        realm: string,
        options:PlotViewOptions,
        context: DiscordCommandContext
    ) {
        var embed = new MessageEmbed()
        embed.title = "Plots";

        if (context.message.guild && context.message.member) {
            var plotView:PlotView;
            var repo = new MSSqlRepository();
            
            if (!realm){
                realm = context.realmSettings.defaultRealmName; 
            }

            if (options.coordinateSearch) {
                var coords:number[] = [];
                
                options.coordinateSearch.split(',').forEach(s => {
                    coords.push(+s);
                });

                if (coords.length != 3) {
                    throw new Error ("You must provide 3 numbers, separated by commas!");
                }

                plotView = await repo.getPlotsRealmAndCoordinates (
                    context.message.guild.id,
                    realm,
                    coords[1],
                    coords[2],
                    coords[0],
                    "Overworld");

            } else if (options.all) {
                var plotView = await repo.GetPlotsByRealm(context.message.guild.id, realm);
            } else {
                if (!owner) {
                    owner = context.message.member.id
                }

                plotView = await repo.getPlotsByOwnerAndRealm (
                    context.message.guild.id,
                    realm,
                    owner);
            }

            if (plotView.items.length > 0){
                plotView.items.forEach(plot => {
                    var val = plot.getEmbedValue(context);
                    embed.fields.push({ name: "Plot Details", value: val,inline:false }); 
                });
            } else {
                embed.fields.push({ name: "Plot Details", value: "No claimed plots",inline:false }); 
            }
        } else {
            embed.fields.push({ name: "Error", value: "Somehow this message wasn't sent from a server or a person...",inline:false });
        }
        return embed;
    }
}