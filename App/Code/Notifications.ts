import Utils from "./JCal/Utils";
import JDate from "./JCal/JDate";
import { nowAtLocation } from "./JCal/JDateUtils";
import { NightDay } from "./Chashavshavon/Onah";
import { GLOBALS, log, range } from "./GeneralUtils";
import { Time } from "luach-types";
import AppData from "./Data/AppData";

enum NotificationEventType {
    Hefsek = 101,
    MorningBedika = 102,
    AfternoonBedika = 103,
    Mikvah = 104,
    FlaggedDayOnah = 105,
    FlaggedNightOnah = 106,
}

/**
 * Adds a system local scheduled notification
 * @param {Number} id
 * @param {String} title
 * @param {String} message
 * @param {Date} date
 */
export function addNotification(
    id: number,
    title: string,
    message: string,
    date: Date
) {
    if (date.getTime() < new Date().getTime()) {
        log(
            `PushNotification.localNotificationSchedule  - notification date is after the current date. No notification will be scheduled.${JSON.stringify(
                { id, title, message, date }
            )}`
        );
    } else {
        PushNotification.localNotificationSchedule({
            date,
            message,
            id: id.toString(), // (optional) Valid unique 32 bit integer specified as string. default: Auto-generated Unique ID
            userInfo: { id: id.toString() },
            ticker: "Luach Alarm",
            autoCancel: true,
            largeIcon: "ic_launcher", // (optional) default: "ic_launcher"
            smallIcon: "ic_notification", // (optional) default: "ic_notification" with fallback for "ic_launcher"
            bigText: message,
            subText: title,
            // color: '@android:color/scroll', // (optional) default: system default
            vibrate: true,
            vibration: 1000,
            tag: title, // (optional) add tag to message
            group: "Luach Reminders", // (optional) add group to message
            ongoing: false,
            priority: "high",
            visibility: "public",
            importance: "high",
alertAction: "view", // (optional) default: view
            category: "Luach", // (optional) default: null
            title,
            playSound: true,
            soundName: "default",
            number: "10",
            // repeatType: 'day', // (optional) Repeating interval. Check 'Repeating Notifications' section for more info.
            actions: "[]",
        });
        log(
            `PushNotification.localNotificationSchedule ${JSON.stringify({
                id,
                title,
                message,
                date,
            })}`
        );
    }
}

/**
 *
 * @param {id:number} id
 */
export function cancelAlarm(id: number) {
    PushNotification.cancelLocalNotifications({
        id: id.toString(),
    });
}

/**
 *
 */
export function cancelAllAlarms() {
    PushNotification.cancelAllLocalNotifications();
}

/**
 *
 * @param {taharaEventId:number} id
 */
export function cancelAllMorningBedikaAlarms(taharaEventId: number) {
    range(7).forEach((i) => {
        try {
            cancelAlarm(
                `${NotificationEventType.MorningBedika}${taharaEventId}${i}`
            );
        } catch (e) {
            /* Nu, nu */
        }
    });
}

/**
 *
 * @param {taharaEventId:number} id
 */
export function cancelAllAfternoonBedikaAlarms(taharaEventId: number) {
    for (const i of range(7)) {
        try {
            cancelAlarm(
                `${NotificationEventType.AfternoonBedika}${taharaEventId}${i}`
            );
        } catch (e) {
            /* Nu, nu */
        }
    }
}

/**
 *
 * @param {taharaEventId:number} id
 */
export function cancelAllBedikaAlarms(taharaEventId: number) {
    cancelAllMorningBedikaAlarms(taharaEventId);
    cancelAllAfternoonBedikaAlarms(taharaEventId);
}

/**
 *
 */
export function cancelMikvaAlarm() {
    try {
        cancelAlarm(NotificationEventType.Mikvah);
    } catch (e) {
        /* Nu, nu */
    }
}

/**
 * Cancels the "Do a Hefsek" reminder (if available)
 */
export function cancelHefsekTaharaAlarm() {
    try {
        cancelAlarm(NotificationEventType.Hefsek);
    } catch (e) {
        /* Nu, nu */
    }
}

/**
 * Creates a system reminder to do a hefsek tahara on the given date and time.
 * @param {JDate} jdate
 * @param {Time} time
 * @param {Time} sunset
 * @param  {Boolean} discreet
 */
export function addHefsekTaharaAlarm(
    jdate: JDate,
    time: Time,
    sunset: Time,
    discreet: boolean
) {
    const hefsekText = discreet ? "H.T." : "Hefsek Tahara",
        sdate = jdate.getDate();
    sdate.setHours(time.hour, time.minute, 0);
    addNotification(
        NotificationEventType.Hefsek,
        `Luach - ${hefsekText} Reminder`,
        `A  ${hefsekText} may be possible today before shkiah.\nSunset today is at ${Utils.getTimeString(
            sunset,
            GLOBALS.IS_24_HOUR_FORMAT
        )}.`,
        sdate
    );
}

/**
 *
 * @param {hefsekJdate} hefsekJdate
 * @param {Number} dayNumber
 * @param {string} description
 * @param {Time} time
 * @param {Number} taharaEventId
 * @param  {Boolean} discreet
 */
export function addMorningBedikaAlarms(
    this: any,
    hefsekJdate: JDate,
    taharaEventId: number,
    time: Time,
    discreet: boolean
) {
    const bedikaText = discreet ? "B." : "Bedikah",
        // Secular Date of hefsek
        sdate = hefsekJdate.getDate();
    // Set the correct reminder time
    sdate.setHours(time.hour, time.minute, 0);
    for (const i of range(7)) {
        // Next day...
        sdate.setDate(sdate.getDate() + 1);
        addNotification(
            `${NotificationEventType.MorningBedika}${taharaEventId}${i}`,
            `Luach - ${bedikaText} Reminder`,
            `Today is the ${Utils.toSuffixed(i)} day of the ${
                this.discreet ? "7" : "Shiva Neki'im"
            }.\nThis is a reminder to do the morning ${bedikaText}`,
            sdate
        );
    }
}
/**
 *
 * @param {JDate} hefsekJdate
 * @param {Number} dayNumber
 * @param {string} description
 * @param {Number} hoursBeforeSunset
 * @param {Location} location
 * @param {Number} taharaEventId
 * @param {Boolean} discreet
 */
export function addAfternoonBedikaAlarms(
    hefsekJdate: { getDate: () => any; addDays: (arg0: number) => any },
    taharaEventId: any,
    hoursBeforeSunset: number,
    location: any,
    discreet: any
) {
    const bedikaText = discreet ? "B." : "Bedikah",
        // Secular Date of hefsek
        sdate = hefsekJdate.getDate();

    for (const i of range(7)) {
        const jdate = hefsekJdate.addDays(i),
            { sunset } = jdate.getSunriseSunset(location);

        // Next secular day...
        sdate.setDate(sdate.getDate() + 1);
        // Set the correct reminder time
        sdate.setHours(sunset.hour + hoursBeforeSunset, sunset.minute, 0);

        addNotification(
            `${NotificationEventType.AfternoonBedika}${taharaEventId}${i}`,
            `Luach - ${bedikaText} Reminder`,
            `Today is the ${Utils.toSuffixed(i)} day of the ${
                discreet ? "7" : "Shiva Neki'im"
            }.\nThis is a reminder to do the afternoon ${bedikaText}.\nSunset is at ${Utils.getTimeString(
                sunset,
                GLOBALS.IS_24_HOUR_FORMAT
            )}`,
            sdate
        );
    }
}
/**
 *
 * @param {JDate} jdate
 * @param {Time} time
 * @param {Time} sunset
 * @param  {discreet:Boolean} discreet
 */
export function addMikvaAlarm(
    jdate: { getDate: () => any },
    time: Time,
    sunset: Time,
    discreet: any
) {
    const txt = discreet ? "M." : "Mikvah",
        sdate = jdate.getDate();
    sdate.setHours(time.hour, time.minute, 0);
    addNotification(
        NotificationEventType.Mikvah,
        `Luach - ${txt} Reminder`,
        `This is a reminder ${
            discreet ? "about" : "to go to"
        } the ${txt} tonight.\nSunset is at ${Utils.getTimeString(
            sunset,
            GLOBALS.IS_24_HOUR_FORMAT
        )}.`,
        sdate
    );
}
/**
 * @param {AppData} appData
 */
export function resetDayOnahReminders(appData: AppData) {
    const now = nowAtLocation(appData.Settings.location),
        problemOnahs = appData.ProblemOnahs.filter(
            (po: { NightDay: NightDay; jdate: { Abs: number } }) =>
                po.NightDay === NightDay.Day && po.jdate.Abs >= now.Abs
        ),
        { remindDayOnahHour } = appData.Settings,
        { location } = appData.Settings,
        { discreet } = appData.Settings;

    removeAllDayOnahReminders();
    let counter = 1;
    for (const po of problemOnahs) {
        if (counter >= 25) {
            break;
        }
        const { jdate } = po,
            { sunrise } = jdate.getSunriseSunset(location),
            sunriseString = Utils.getTimeString(
                sunrise,
                GLOBALS.IS_24_HOUR_FORMAT
            ),
            sdate = jdate.getDate();
        sdate.setHours(sunrise.hour + remindDayOnahHour, sunrise.minute, 0);
        addNotification(
            `${NotificationEventType.FlaggedDayOnah}${counter}`,
            "Luach - Daytime flagged date notification",
            `${
                discreet
                    ? `The daytime of ${jdate.toString()} needs to be observed.`
                    : po.toString()
            }\nSunrise is at ${sunriseString}`,
            sdate
        );
        counter++;
    }
}
/**
 * @param {AppData} appData
 */
export function resetNightOnahReminders(appData: AppData) {
    const now = nowAtLocation(appData.Settings.location),
        problemOnahs = appData.ProblemOnahs.filter(
            (po: { NightDay: NightDay; jdate: { Abs: number } }) =>
                po.NightDay === NightDay.Night && po.jdate.Abs >= now.Abs
        ),
        { remindNightOnahHour } = appData.Settings,
        { location } = appData.Settings,
        { discreet } = appData.Settings;
    removeAllNightOnahReminders();
    let counter = 1;
    for (const po of problemOnahs) {
        if (counter >= 25) {
            break;
        }
        const { jdate } = po,
            { sunset } = jdate.getSunriseSunset(location),
            sunsetString = Utils.getTimeString(
                sunset,
                GLOBALS.IS_24_HOUR_FORMAT
            ),
            sdate = jdate.getDate();
        sdate.setHours(sunset.hour + remindNightOnahHour, sunset.minute, 0);
        addNotification(
            `${NotificationEventType.FlaggedNightOnah}${counter}`,
            "Luach - Nighttime flagged date notification",
            `${
                discreet
                    ? `The nighttime of ${jdate.toString()} needs to be observed.`
                    : po.toString()
            }\nSunset is at ${sunsetString}`,
            sdate
        );
        counter++;
    }
}
export function removeAllDayOnahReminders() {
    for (const i of range(25)) {
        try {
            cancelAlarm(`${NotificationEventType.FlaggedDayOnah}${i}`);
        } catch (e) {
            /* Nu, nu */
        }
    }
}
export function removeAllNightOnahReminders() {
    for (const i of range(25)) {
        try {
            cancelAlarm(`${NotificationEventType.FlaggedNightOnah}${i}`);
        } catch (e) {
            /* Nu, nu */
        }
    }
}
