import { AppView } from '../components/AppShell';

type HomePageProps = {
  projectCount: number;
  agentCount: number;
  pipelineCount: number;
  onNavigate: (view: AppView) => void;
};

const CARDS: Array<{ view: AppView; title: string; body: string }> = [
  {
    view: 'projects',
    title: 'Projetos',
    body: 'Crie e configure os contextos de trabalho que agrupam agentes, pipelines e execucoes.',
  },
  {
    view: 'agents',
    title: 'Agentes',
    body: 'Modele especialistas com prompt, modelo, temperatura, ferramentas e uma descricao clara de responsabilidade.',
  },
  {
    view: 'studio',
    title: 'Studio',
    body: 'Monte o fluxo visual usando agentes ja configurados e valide as regras da V1 antes de executar.',
  },
  {
    view: 'playground',
    title: 'Playground',
    body: 'Teste pipelines prontos, acompanhe historico e leia os traces de cada agente executado.',
  },
];

function HomePage({ projectCount, agentCount, pipelineCount, onNavigate }: HomePageProps) {
  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Projetos</p>
          <p className="mt-2 text-3xl font-semibold">{projectCount}</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Agentes do projeto</p>
          <p className="mt-2 text-3xl font-semibold">{agentCount}</p>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Pipelines do projeto</p>
          <p className="mt-2 text-3xl font-semibold">{pipelineCount}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {CARDS.map((card) => (
          <button
            className="rounded border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-400 hover:shadow"
            key={card.view}
            onClick={() => onNavigate(card.view)}
            type="button"
          >
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.body}</p>
          </button>
        ))}
      </section>
    </div>
  );
}

export default HomePage;
