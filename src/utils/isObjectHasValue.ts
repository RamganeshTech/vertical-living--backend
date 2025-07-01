export const isObjectHasValue: (obj:object) => boolean = (obj: Object) => {
    if (typeof obj !== "object") {
        throw Error("not an object")
    }
    return Object.values(obj).some(value => value !== "" && value !== null && value !== undefined)
}