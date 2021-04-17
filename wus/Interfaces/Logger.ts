export enum LogLevel {
    Verbose = 1,
    Debug = 2,
    Info = 3,
    Warning = 4,
    Error = 5,
    Fatal = 6,
    Disable = 9,
}

export interface Logger {
    Log(level: LogLevel, message: string): void
}