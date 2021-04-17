import dateFormat from 'dateformat'
import chalk from 'chalk'
import { Logger, LogLevel } from './Interfaces/Logger'


export class WusLogger implements Logger {
    private readonly minLevel: LogLevel
    private readonly warning = chalk.bgKeyword('orange').gray
    private readonly error = chalk.bgRed.white

    constructor(minLevel: LogLevel) {
        this.minLevel = minLevel
    }

    public Log(level: LogLevel, message: string): void {
        if (level < this.minLevel) return

        let color = chalk.white
        let prefix = ''

        switch (level) {
            case LogLevel.Verbose: {
                prefix = 'VRB'
                color = chalk.gray
                break
            }
            case LogLevel.Debug: {
                prefix = 'DBG'
                color = chalk.gray
                break
            }
            case LogLevel.Warning: {
                prefix = 'WRN'
                color = this.warning
                break
            }
            case LogLevel.Info: {
                prefix = 'INF'
                break
            }
            case LogLevel.Error: {
                prefix = 'ERR'
                color = this.error
                break
            }
            case LogLevel.Fatal: {
                prefix = 'FTL'
                color = this.error
            }
        }

        console.log(`[${dateFormat(new Date(), 'HH:MM:ss.L')} ${color(prefix)}] ${message}`)
    }
}
