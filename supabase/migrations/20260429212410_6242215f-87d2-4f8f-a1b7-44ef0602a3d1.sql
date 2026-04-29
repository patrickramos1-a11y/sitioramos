-- Atualizar etapas com depends_on_id que ainda não têm datas
UPDATE public.operational_stages s
SET data_inicio_prevista = (dep.data_fim_prevista + INTERVAL '1 day')::date,
    data_fim_prevista = (dep.data_fim_prevista + INTERVAL '1 day' + (s.duracao_prevista_dias - 1 || ' days')::interval)::date
FROM public.operational_stages dep
WHERE s.depends_on_id = dep.id
  AND s.data_inicio_prevista IS NULL
  AND dep.data_fim_prevista IS NOT NULL
  AND s.duracao_prevista_dias IS NOT NULL;

-- Repetir para netos (cascata)
UPDATE public.operational_stages s
SET data_inicio_prevista = (dep.data_fim_prevista + INTERVAL '1 day')::date,
    data_fim_prevista = (dep.data_fim_prevista + INTERVAL '1 day' + (s.duracao_prevista_dias - 1 || ' days')::interval)::date
FROM public.operational_stages dep
WHERE s.depends_on_id = dep.id
  AND s.data_inicio_prevista IS NULL
  AND dep.data_fim_prevista IS NOT NULL
  AND s.duracao_prevista_dias IS NOT NULL;