if (typeof navigator === "undefined") {
    Object.defineProperty(globalThis, "navigator", {
        value: {
            userAgent: ""
        }
    });
}

export default 1;