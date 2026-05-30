// Contest route paths that adapt to hostname
// concurso.intercutmedia.com uses short paths
// quiztroyer.istavnile.cloud uses /concursos/el-gran-upgrade prefix

const isConcursoHost = typeof window !== 'undefined' && window.location.hostname === 'concurso.intercutmedia.com';

export const CONTEST_PATHS = {
  LANDING: isConcursoHost ? '/' : '/concursos/el-gran-upgrade',
  FORM: isConcursoHost ? '/inscripcion' : '/concursos/el-gran-upgrade/inscripcion',
  VOTING: isConcursoHost ? '/votacion' : '/concursos/el-gran-upgrade/votacion',
};
