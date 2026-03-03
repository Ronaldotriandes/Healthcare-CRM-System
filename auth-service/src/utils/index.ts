export const getIndonesiaDate = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const indonesiaTime = new Date(utc + (7 * 3600000));
    return indonesiaTime;
}