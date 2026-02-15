
import { Router } from "express";
import { getMatchStatus } from "../utils/matchStatus.js"
import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches.validation.js";
import { Matches } from "../db/schema.js"//after dbconnection--->importante


export const matchRouter = Router();
const MAX_LIMIT = 100;

matchRouter.get("/", async (req, res) => {
    console.log("cointroller get matches");


    try {
        const parsed = listMatchesQuerySchema.safeParse(req.query);
        console.log(parsed);
        if (!parsed.success) return res.status(400).json({ error: "Invalid payload", details: parsed.error.issues })

        const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);
        console.log("limit", limit);

        // Ahora pasamos limit como un número directamente
        const allMatches = await Matches.findAll({
            order: [['createdAt', 'DESC']],
            limit: limit  // Aquí pasamos el número directamente, no un objeto
        });
        return res.status(200).json({ message: "maches get", details: allMatches });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "maches get all failed", detalies: error.message });

    }
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

        const match=event.dataValues;

        if(res.app.locals.broadcastMatchCreated)
        {
            res.app.locals.broadcastMatchCreated(match)
        }

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
