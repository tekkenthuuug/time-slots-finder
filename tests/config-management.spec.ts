import {
	_mergeOverlappingShifts,
	_isUnavailablePeriodValid,
	isConfigurationValid,
} from "../src/config-management"
import { TimeSlotsFinderError } from "../src/errors"
import { Shift } from "../src"

describe("#_mergeOverlappingShifts", () => {
	it("should handle too small arrays properly", () => {
		const emptyArray: Shift[] = []
		const smallArray = [{ startTime: "12:00", endTime: "14:00" }]

		expect(_mergeOverlappingShifts(emptyArray)).toEqual(emptyArray)
		expect(_mergeOverlappingShifts(smallArray)).toEqual(smallArray)
	})
	it("should merge partial overlap", () => {
		const shiftsArray = [
			{ startTime: "08:00", endTime: "12:00" },
			{ startTime: "10:00", endTime: "18:00" },
		]
		expect(_mergeOverlappingShifts(shiftsArray)).toEqual([
			{ startTime: "08:00", endTime: "18:00" },
		])
	})
	it("should delete full overlapped shifts", () => {
		const shiftsArray = [
			{ startTime: "08:00", endTime: "12:00" },
			{ startTime: "10:00", endTime: "11:00" },
		]
		expect(_mergeOverlappingShifts(shiftsArray)).toEqual([
			{ startTime: "08:00", endTime: "12:00" },
		])
	})
	it("should handle array without overlapping shifts", () => {
		const shiftsArray = [
			{ startTime: "08:00", endTime: "12:00" },
			{ startTime: "14:00", endTime: "18:00" },
		]
		expect(_mergeOverlappingShifts(shiftsArray)).toEqual([
			{ startTime: "08:00", endTime: "12:00" },
			{ startTime: "14:00", endTime: "18:00" },
		])
	})
	it("should not mutate the passed array", () => {
		const smallArray = [{ startTime: "08:00", endTime: "12:00" }]
		const normalArray = [
			{ startTime: "08:00", endTime: "12:00" },
			{ startTime: "14:00", endTime: "18:00" },
		]
		const normalArrayWithOverlaps = [
			{ startTime: "08:00", endTime: "12:00" },
			{ startTime: "11:00", endTime: "14:00" },
		]
		expect(_mergeOverlappingShifts(smallArray)).not.toBe(smallArray)
		expect(_mergeOverlappingShifts(normalArray)).not.toBe(normalArray)
		expect(_mergeOverlappingShifts(normalArrayWithOverlaps)).not.toBe(normalArrayWithOverlaps)
	})
	it("should handle complex array of shifts", () => {
		const shiftsArray = [
			{ startTime: "13:30", endTime: "16:00" },
			{ startTime: "09:30", endTime: "12:00" },
			{ startTime: "08:00", endTime: "10:00" },
			{ startTime: "15:00", endTime: "16:00" },
			{ startTime: "16:00", endTime: "18:00" },
			{ startTime: "14:30", endTime: "15:30" },
		]
		expect(_mergeOverlappingShifts(shiftsArray)).toEqual([
			{ startTime: "08:00", endTime: "12:00" },
			{ startTime: "13:30", endTime: "18:00" },
		])
	})
})

describe("#_isUnworkedShiftValid", () => {
	it("should return false for invalid dates", () => {
		expect(_isUnavailablePeriodValid({
			startAt: "",
			endAt: "",
		})).toBe(false)
		expect(_isUnavailablePeriodValid({
			startAt: "1994-10-12 23:55",
			endAt: "",
		})).toBe(false)
		expect(_isUnavailablePeriodValid({
			startAt: "",
			endAt: "1994-10-12 23:55",
		})).toBe(false)
		expect(_isUnavailablePeriodValid({
			startAt: "1994-10-12 23:55",
			endAt: "1994-13-12 23:55",
		})).toBe(false)
		expect(_isUnavailablePeriodValid({
			startAt: "1994-10-12 23:55",
			endAt: "1994-10-13 24:55",
		})).toBe(false)
		expect(_isUnavailablePeriodValid({
			startAt: "10-12 23:55",
			endAt: "10-13 23:75",
		})).toBe(false)
	})
	it("should return false if endAt is equal or before startAt", () => {
		expect(_isUnavailablePeriodValid({
			startAt: "1994-10-12 23:55",
			endAt: "1994-10-11 23:55",
		})).toBe(false)
	})
	it("should return false if endAt and startAt have different format", () => {
		expect(_isUnavailablePeriodValid({
			startAt: "10-12 23:55",
			endAt: "1994-10-13 23:55",
		})).toBe(false)
		expect(_isUnavailablePeriodValid({
			startAt: "1994-10-12 23:55",
			endAt: "10-13 23:55",
		})).toBe(false)
	})
	it("should return true if endAt is before startAt without a specific year", () => {
		expect(_isUnavailablePeriodValid({
			startAt: "12-24 23:55",
			endAt: "01-01 23:55",
		})).toBe(true)
	})
	it(`should return true if endAt and startAt have same valid format and are correctly ordered`, () => {
		expect(_isUnavailablePeriodValid({
			startAt: "1994-12-24 23:55",
			endAt: "1995-01-01 23:55",
		})).toBe(true)
		expect(_isUnavailablePeriodValid({
			startAt: "1994-12-24 23:55",
			endAt: "1994-12-26 23:55",
		})).toBe(true)
		expect(_isUnavailablePeriodValid({
			startAt: "12-24 23:55",
			endAt: "12-26 23:55",
		})).toBe(true)
	})
})

describe("#isConfigurationValid", () => {
	it("should throw for invalid configurations", () => {
		expect(() => isConfigurationValid(null as never))
			.toThrowError(new TimeSlotsFinderError(`No configuration defined`))
		expect(() => isConfigurationValid({} as never))
			.toThrowError(new TimeSlotsFinderError(`Slot duration must be at least 1 minute`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 0,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "19:00",
					endTime: "21:00",
				}],
			}],
		})).toThrowError(new TimeSlotsFinderError(`Slot duration must be at least 1 minute`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 15,
			slotStartMinuteMultiple: 0,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "19:00",
					endTime: "21:00",
				}],
			}],
		})).toThrowError(new TimeSlotsFinderError(`Slot start minute multiple must be contained between 1 and 30`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 15,
			slotStartMinuteMultiple: 40,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "19:00",
					endTime: "21:00",
				}],
			}],
		})).toThrowError(new TimeSlotsFinderError(`Slot start minute multiple must be contained between 1 and 30`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 15,
			slotStartMinuteMultiple: -10,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "19:00",
					endTime: "21:00",
				}],
			}],
		})).toThrowError(new TimeSlotsFinderError(`Slot start minute multiple must be contained between 1 and 30`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			minAvailableTimeBeforeSlot: -1,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "19:00",
					endTime: "21:00",
				}],
			}],
		})).toThrowError(new TimeSlotsFinderError(`Time before a slot must be at least 0 minutes`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			minAvailableTimeAfterSlot: -1,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "19:00",
					endTime: "21:00",
				}],
			}],
		})).toThrowError(new TimeSlotsFinderError(`Time after a slot must be at least 0 minutes`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			minTimeBeforeFirstSlot: -1,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "19:00",
					endTime: "21:00",
				}],
			}],
		})).toThrowError(new TimeSlotsFinderError(`The number of minutes before first slot must be 0 or more`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			minTimeBeforeFirstSlot: 48 * 60,
			maxDaysBeforeLastSlot: 1,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "19:00",
					endTime: "21:00",
				}],
			}],
		})).toThrowError(new TimeSlotsFinderError(`The first possible slot will always be after last one possible (see minTimeBeforeFirstSlot and maxDaysBeforeLastSlot)`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			maxDaysBeforeLastSlot: 0,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "19:00",
					endTime: "21:00",
				}],
			}],
		})).toThrowError(new TimeSlotsFinderError(`The number of days before latest slot must be at least 1`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			timeZone: "InvalidTZ",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "19:00",
					endTime: "21:00",
				}],
			}],
		})).toThrowError(new TimeSlotsFinderError(`Invalid time zone: InvalidTZ`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			timeZone: "Europe/Paris",
			availablePeriods: null as never,
		})).toThrowError(new TimeSlotsFinderError(`A list of available periods is expected`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			timeZone: "Europe/Paris",
			availablePeriods: {
				isoWeekDay: 4,
				shifts: [{ startTime: "09:00", endTie: "19:00" }]
			} as never,
		})).toThrowError(new TimeSlotsFinderError(`A list of available periods is expected`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			timeZone: "Europe/Paris",
			availablePeriods: [],
			unavailablePeriods: [{
				startAt: "20201013T18:00:00:000Z",
				endAt: "20201013T20:00:00:000Z",
			}],
		})).toThrowError(new TimeSlotsFinderError(`Unavailable period nº1 is invalid`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			timeZone: "Europe/Paris",
			availablePeriods: [],
			unavailablePeriods: [{
				startAt: "2020-10-13 18:00",
				endAt: "10-13 20:00",
			}],
		})).toThrowError(new TimeSlotsFinderError(`Unavailable period nº1 is invalid`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: "0" as never,
				shifts: [],
			}],
		})).toThrowError(new TimeSlotsFinderError(`ISO Weekday must and integer for available period nº1`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 0,
				shifts: [],
			}],
		})).toThrowError(new TimeSlotsFinderError(`ISO Weekday must be contains between 1 (Monday) and 7 (Sunday) for available period nº1`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 8,
				shifts: [],
			}],
		})).toThrowError(new TimeSlotsFinderError(`ISO Weekday must be contains between 1 (Monday) and 7 (Sunday) for available period nº1`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "21:00",
					endTime: "19:00",
				}],
			}],
		})).toThrowError(new TimeSlotsFinderError(`Daily shift 21:00 - 19:00 for available period nº1 is invalid`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "19:00",
					endTime: "25:00",
				}],
			}],
		})).toThrowError(new TimeSlotsFinderError(`Daily shift 19:00 - 25:00 for available period nº1 is invalid`))
		expect(() => isConfigurationValid({
			timeSlotDuration: 12,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "19:00",
					endTime: "21:00",
				}, {
					startTime: "19:30",
					endTime: "22:00",
				}],
			}],
		})).toThrowError(new TimeSlotsFinderError(`Some shifts are overlapping for available period nº1`))
	})
	it("should return true for valid configurations", () => {
		expect(isConfigurationValid({
			timeSlotDuration: 12,
			minAvailableTimeBeforeSlot: 10,
			minAvailableTimeAfterSlot: 10,
			minTimeBeforeFirstSlot: 48 * 60,
			maxDaysBeforeLastSlot: 30,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "19:00",
					endTime: "21:00",
				}],
			}],
			unavailablePeriods: [{
				startAt: "10-13 18:00",
				endAt: "10-01 20:00",
			}],
		})).toBe(true)
		expect(isConfigurationValid({
			timeSlotDuration: 12,
			timeZone: "Europe/Paris",
			availablePeriods: [{
				isoWeekDay: 1,
				shifts: [{
					startTime: "19:00",
					endTime: "21:00",
				}],
			}],
		})).toBe(true)
		expect(isConfigurationValid({
			timeSlotDuration: 12,
			minAvailableTimeBeforeSlot: 3,
			minAvailableTimeAfterSlot: 7,
			timeZone: "Europe/Paris",
			availablePeriods: [],
		})).toBe(true)
	})
})
