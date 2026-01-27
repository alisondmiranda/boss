-- Remove a regra antiga que esta causando o erro
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Cria a nova regra permitindo tudo (A fazer, Fazendo, Feito e Lixeira)
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
CHECK (status IN ('todo', 'doing', 'done', 'trash'));

-- Garante que a coluna de data da lixeira exista
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS trash_date TIMESTAMP WITH TIME ZONE;