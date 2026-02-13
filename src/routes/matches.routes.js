
import { Router } from "express";
import { getMatchStatus } from "../utils/matchStatus.js"
import { createMatchSchema } from "../validation/matches.validation.js";
import { Matches } from "../db/schema.js"//after dbconnection--->importante


export const matchRouter = Router();

matchRouter.get("/", (req, res) => {
    console.log("cointroller get matches");
    res.status(200).json({ message: "maches get" });
});
matchRouter.post("/", async (req, res) => {
    console.log("controller post matches");
    console.log(req.body);

    const parsed = createMatchSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: "invalid payload",
            details: parsed.error
        });
    }

    const { startTime, endTime, homeScore, awayScore } = parsed.data;

    try {
        const event = await Matches.create({
            ...parsed.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startTime, endTime)
        });

        return res.status(200).json({
            message: "matches POST",
            details: event
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to create match [matches POST]",
            details: error
        });
    }
});
