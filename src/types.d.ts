import { DEFAULT_SETTINGS } from "./data/defaultSettings";
import { GAMEMODES } from "./data/gamemodes";
import { GameStats } from "./features/stats";
import { TetiTimer } from "./movement/tetitimers";

declare global {
    const PIXI: typeof import("pixi.js");
    type Graphics = InstanceType<typeof PIXI.Graphics>;
    type Container = InstanceType<typeof PIXI.Container>;
    type Sprite = InstanceType<typeof PIXI.Sprite>;
    type PixiText = InstanceType<typeof PIXI.Text>;
    type Texture = InstanceType<typeof PIXI.Texture>;

    // fake gsap types, not real (add as needed)
    declare module gsap {
        export class Timeline {
            to(el?: any, vars?: any, time?: any): this;
            set(el?: any, vars?: any, time?: any): this;
            add(el?: any, vars?: any): this;
            kill();
            pause();
            totalProgress(time?: any);
        }

        export function timeline(vars?: any): Timeline;
        export function to(element?: any, vars?: any): any;
        export function registerPlugin(plugin: any)
        export function killTweensOf(child: any)
    }

    interface ArrTimings {
        arr?: TetiTimer,
        sd?: TetiTimer
    }

    type DirectionState = boolean | "das" | "arr";
    type DirectionType = "RIGHT" | "LEFT" | "DOWN"
    type AllDirectionType = "RIGHT" | "LEFT" | "DOWN" | "UP"
    type DirectionStates = Record<DirectionType, DirectionState>
    type CollisionAction = DirectionType | "ROTATE" | "PLACE" | "SPAWN"

    type PieceNamesShort = "z" | "s" | "l" | "o" | "i" | "t" | "j"
    type PieceName = PieceNamesShort | "G"
    type MinoTextures = Record<PieceNamesShort | "hold" | "shadow" | "darkg" | "topout", Texture>

    type BoardType = "board" | "hold" | "next"
    type MinoSprites = Record<BoardType, PIXI.Sprite[][]>
    type MinoFlashing = Record<string, gsap.Timeline>
    type PixiTexts = Record<string, { sprite: PixiText, animation: gsap.Timeline }>
    type PixiStatTexts = { stat: PixiText, statText: PixiText, statSecondary: PixiText }[]

    type BoardArray = string[][]

    type GarbageQueue = Array<{ damage: number, travel: number }>;

    interface Piece {
        name: PieceName;
        shape0: number[][];
        shape1?: number[][];
        shape2?: number[][];
        shape3?: number[][];
        colour: string;
    }

    type RotationType = "CW" | "CCW" | "180"

    type OldGameSettings = typeof DEFAULT_SETTINGS.game;
    type GameSettings = Omit<OldGameSettings, "gamemode"> & {gamemode: ModeName}; // changes gamemode to be ModeName
    type DisplaySettings = typeof DEFAULT_SETTINGS.display;
    type ControlSettings = typeof DEFAULT_SETTINGS.control;
    type HandlingSettings = typeof DEFAULT_SETTINGS.handling;
    type VolumeSettings = typeof DEFAULT_SETTINGS.volume;

    type ModeName = keyof typeof GAMEMODES;
    type ModeData<ModeName> = typeof GAMEMODES[ModeName]

    type StatKeys = keyof GameStats

    interface PBType {
        score: number, 
        pbstats: Record<StatKeys, any>, 
        version: string, 
        ts: string
    }

    type ReplayEvents = Record<number, {keydown: string[], keyup: string[]}>
}
