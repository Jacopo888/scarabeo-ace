-- Create game_chats table for in-game messaging
CREATE TABLE public.game_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL,
  player_id uuid NOT NULL,
  player_name text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.game_chats ENABLE ROW LEVEL SECURITY;

-- Create policies for game chat access
CREATE POLICY "Players can view chat for their games" 
ON public.game_chats 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.games 
    WHERE games.id = game_chats.game_id 
    AND (auth.uid() = games.player1_id OR auth.uid() = games.player2_id)
  )
);

CREATE POLICY "Players can send messages to their games" 
ON public.game_chats 
FOR INSERT 
WITH CHECK (
  auth.uid() = player_id AND
  EXISTS (
    SELECT 1 FROM public.games 
    WHERE games.id = game_chats.game_id 
    AND (auth.uid() = games.player1_id OR auth.uid() = games.player2_id)
  )
);

-- Enable realtime for game_chats
ALTER TABLE public.game_chats REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_chats;