const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const router = express.Router();

router.post("/", authRequired, async (req,res)=>{
  try{
    const [p] = await db.query("SELECT id FROM profiles WHERE user_id=?", [req.user.id]);
    if(!p.length) return res.status(404).json({error:"Profile not found."});
    const a=req.body.analysis||{};
    const [r]=await db.query("INSERT INTO analyses(profile_id,target_role,score,analysis_json) VALUES(?,?,?,?)",
      [p[0].id, req.body.targetRole||"", Number(a.overallScore)||0, JSON.stringify(a)]);
    res.status(201).json({id:r.insertId});
  }catch(e){console.error(e);res.status(500).json({error:"Could not save analysis."});}
});
module.exports=router;
