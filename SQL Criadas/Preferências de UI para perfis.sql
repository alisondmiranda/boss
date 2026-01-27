-- Adiciona coluna para preferências de UI (estado das sidebars)
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ui_preferences JSONB DEFAULT '{"isRightSidebarOpen": false, "isLeftSidebarExpanded": true}'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN profiles.ui_preferences IS 'Armazena preferências de UI do usuário: estado das sidebars esquerda e direita';