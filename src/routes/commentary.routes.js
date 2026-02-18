import { Router } from "express";
import { matchIdParamSchema } from "../validation/matches.validation.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.validation.js";
import { Commentary } from "../db/schema.js"
export const commentaryRouter = Router({ mergeParams: true });


const MAX_LIMIT = 100;

commentaryRouter.get("/", async (req, res) => {

    console.log("get commentarys");
    const paramsResult = matchIdParamSchema.safeParse(req.params);
    if (!paramsResult.success) return res.status(400).json({ error: "Invalid id match", details: paramsResult.error.issues });


    const queryResult = listCommentaryQuerySchema.safeParse(req.query);
    if (!queryResult.success) return res.status(400).json({ error: "Invalid query params", details: queryResult.error.issues });

    try {
        const { id: matchId } = paramsResult.data;
        const { limit = 10 } = queryResult.data;

        const safeLimit = Math.min(limit, MAX_LIMIT);
        const result = await Commentary.findAll({
            where: { matchId },
            order: [['createdAt', 'DESC']],
            limit: safeLimit
        });
        return res.status(200).json({ data: result });
    } catch (error) {
        console.error("Failed list commentary", error);
        res.status(500).json({ error: "Failed list commentary" })
    }

});

commentaryRouter.post("/", async (req, res) => {
    console.log(req);
    console.log("post create commentary", req.params.id);

    const paramsResult = matchIdParamSchema.safeParse(req.params);
    console.log(paramsResult.data);
    if (!paramsResult.success) return res.status(400).json({ error: "Invalid match id", details: paramsResult.error.issues });

    const bodyResult = createCommentarySchema.safeParse(req.body);

    if (!bodyResult.success) return res.status(400).json({ error: "Invalid commentary payload", details: bodyResult.error.issues });

    try {

        const { minutes, ...rest } = bodyResult.data;
        const result = await Commentary.create({
            matchId: paramsResult.data.id,
            minute:minutes,
            ...rest
        })
        const newCommentary = result.dataValues;
        console.log("new commentary", newCommentary);
        return res.status(201).json({ data: newCommentary });

    } catch (error) {
        console.error("Failed to create commentary", error);
        res.status(500).json({ error: `Failed to create commentary : ${error.message}` });
    }


})
