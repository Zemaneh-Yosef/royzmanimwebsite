declare class BaseCustomError extends Error {
    constructor(message?: string);
}
export declare class NullPointerException extends BaseCustomError {
    constructor();
}
export declare class IllegalArgumentException extends BaseCustomError {
}
export declare class UnsupportedError extends BaseCustomError {
}
export {};
