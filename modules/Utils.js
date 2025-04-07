
/** converts degrees (0-360) to radians which is the standard unit for trigonometric calculations */
export const toRadians = degrees => degrees * Math.PI / 180;

export const sortBy = (array, getValue, descending = true) => {
    return array.sort((a, b) => {
        const valueA = getValue(a);
        const valueB = getValue(b);
        return descending ? valueB - valueA : valueA - valueB;
    });
};
