export declare class Bot {
    private wallet;
    private calculator;
    private isRunning;
    constructor();
    start(): Promise<void>;
    private scanLoop;
    stop(): Promise<void>;
    private delay;
}
