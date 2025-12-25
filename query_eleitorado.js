const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uttvovuufyhqxjmqqbuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dHZvdnV1ZnlocXhqbXFxYnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0MzYwMjAsImV4cCI6MjA0OTAxMjAyMH0.RHf-DjEPMex_DWMqhDMOx2i5vCDzopXJwftPzZvSoLk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getPerfilEleitorado() {
  // Buscar dados de comparecimento/abstenção
  const { data: comparecimento, error: errComp } = await supabase
    .from('comparecimento_abstencao')
    .select('*')
    .ilike('nm_municipio', '%ALTA FLORESTA%')
    .eq('sg_uf', 'RO')
    .eq('ano_eleicao', 2024)
    .eq('nr_turno', 1);

  if (errComp) console.error('Erro comparecimento:', errComp);
  
  // Buscar dados do perfil do eleitorado
  const { data: perfil, error: errPerfil } = await supabase
    .from('perfil_eleitorado')
    .select('*')
    .ilike('nm_municipio', '%ALTA FLORESTA%')
    .eq('sg_uf', 'RO');

  if (errPerfil) console.error('Erro perfil:', errPerfil);

  // Buscar resultados de votação
  const { data: votos, error: errVotos } = await supabase
    .from('boletins_urna')
    .select('nm_votavel, sg_partido, qt_votos, cd_cargo_pergunta')
    .ilike('nm_municipio', '%ALTA FLORESTA%')
    .eq('sg_uf', 'RO')
    .eq('ano_eleicao', 2024)
    .eq('nr_turno', 1)
    .order('qt_votos', { ascending: false })
    .limit(50);

  if (errVotos) console.error('Erro votos:', errVotos);

  console.log('=== COMPARECIMENTO/ABSTENÇÃO ===');
  console.log(JSON.stringify(comparecimento, null, 2));
  
  console.log('\n=== PERFIL DO ELEITORADO ===');
  console.log(JSON.stringify(perfil, null, 2));
  
  console.log('\n=== RESULTADOS DE VOTAÇÃO ===');
  console.log(JSON.stringify(votos, null, 2));
}

getPerfilEleitorado();
