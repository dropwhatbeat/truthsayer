ALTER TABLE "game_rounds" ADD COLUMN "judge_player_id" uuid;
ALTER TABLE "game_rounds" ADD COLUMN "honest_player_id" uuid;
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_judge_player_id_players_id_fk" FOREIGN KEY ("judge_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_honest_player_id_players_id_fk" FOREIGN KEY ("honest_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;
