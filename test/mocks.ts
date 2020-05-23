export class LoggerMock {
    info(msg: string): void {
        console.log(msg);
    }
    debug(msg: string): void {
        console.log(msg);
    }
    error(msg: string): void {
        console.log(msg);
    }
}

export class TplMock<T> {
    create(source: string, target: string, data: T): void {
        return
    }
}
