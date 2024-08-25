import { Midi } from "@tonejs/midi";
import data from "./assets/main.mid?uint8array";
import type { State } from "./state.ts";

export const midi = new Midi(data);
midi.tracks = midi.tracks.filter((track) => !track.name.startsWith("#"));

export const getCurrentTick = (state: State): number => {
	const time = state.currentFrame / 60;
	const tick = midi.header.secondsToTicks(time);
	return tick;
};
export const getCurrentMeasure = (state: State): number => {
	const measure = midi.header.ticksToMeasures(getCurrentTick(state));
	return measure;
};
export const trackMeasures = midi.tracks.map((track) => {
	const measures = new Set(
		track.notes.flatMap((note) => {
			const start = Math.floor(midi.header.ticksToMeasures(note.ticks));
			const end = Math.floor(
				midi.header.ticksToMeasures(note.ticks + note.durationTicks - 1),
			);

			return Array.from({ length: end - start + 1 }, (_, i) => start + i);
		}),
	);

	return measures;
});

const pageStarts = [0, 78];
export const measuresPerPage = 4;
export const getCurrentPageMeasure = (state: State): number => {
	const currentMeasure = getCurrentMeasure(state);
	const lastPageStart =
		pageStarts.findLast((page) => page <= currentMeasure) ?? 0;

	const page =
		Math.floor((currentMeasure - lastPageStart) / measuresPerPage) *
			measuresPerPage +
		lastPageStart;

	return page;
};
