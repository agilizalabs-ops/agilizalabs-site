// Cálculo dos horários livres. Sem dependências: recebe "agora" e os períodos ocupados, devolve as vagas.
import { agenda } from '../../data/agenda';

export interface Intervalo {
  inicio: number;
  fim: number;
}

export interface Dia {
  data: string;
  rotulo: string;
  horarios: { inicio: string; hora: string }[];
}

const MIN = 60_000;
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const minutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** Data local (AAAA-MM-DD) e minutos do dia local -> instante em UTC (ms). */
function instante(dataLocal: string, minutosDoDia: number) {
  return Date.parse(`${dataLocal}T00:00:00Z`) + (minutosDoDia - agenda.fusoMinutos) * MIN;
}

function dataLocal(ms: number) {
  return new Date(ms + agenda.fusoMinutos * MIN).toISOString().slice(0, 10);
}

/** Uma vaga é válida se cai num dia e horário da agenda, respeita a antecedência e não encosta em nada ocupado. */
export function vagaValida(inicio: number, agora: number, ocupados: Intervalo[]) {
  const fim = inicio + agenda.duracaoMinutos * MIN;
  const local = new Date(inicio + agenda.fusoMinutos * MIN);
  const minutoDoDia = local.getUTCHours() * 60 + local.getUTCMinutes();
  if (!agenda.diasDaSemana.includes(local.getUTCDay())) return false;
  if (minutoDoDia < minutos(agenda.inicio) || minutoDoDia + agenda.duracaoMinutos > minutos(agenda.fim)) return false;
  if (minutoDoDia % agenda.duracaoMinutos !== 0) return false;
  if (inicio < agora + agenda.antecedenciaHoras * 60 * MIN) return false;
  if (inicio > agora + agenda.diasAFrente * 24 * 60 * MIN) return false;
  const folga = agenda.folgaMinutos * MIN;
  return !ocupados.some((o) => inicio - folga < o.fim && fim + folga > o.inicio);
}

export function horariosLivres(agora: number, ocupados: Intervalo[]): Dia[] {
  const dias: Dia[] = [];
  for (let d = 0; d <= agenda.diasAFrente; d++) {
    const data = dataLocal(agora + d * 24 * 60 * MIN);
    const horarios: Dia['horarios'] = [];
    for (let m = minutos(agenda.inicio); m + agenda.duracaoMinutos <= minutos(agenda.fim); m += agenda.duracaoMinutos) {
      const inicio = instante(data, m);
      if (vagaValida(inicio, agora, ocupados)) {
        horarios.push({ inicio: new Date(inicio).toISOString(), hora: `${doisDigitos(Math.floor(m / 60))}:${doisDigitos(m % 60)}` });
      }
    }
    if (horarios.length) {
      const [, mes, dia] = data.split('-').map(Number);
      const semana = SEMANA[new Date(`${data}T12:00:00Z`).getUTCDay()];
      dias.push({ data, rotulo: `${semana}, ${dia} ${MESES[mes - 1]}`, horarios });
    }
  }
  return dias;
}

/** Texto amigável de um início em UTC, no horário de Brasília. Ex.: "qua, 4 nov, 09:30". */
export function rotuloDoHorario(inicioISO: string) {
  const ms = Date.parse(inicioISO);
  const local = new Date(ms + agenda.fusoMinutos * MIN);
  return `${SEMANA[local.getUTCDay()]}, ${local.getUTCDate()} ${MESES[local.getUTCMonth()]}, ${doisDigitos(local.getUTCHours())}:${doisDigitos(local.getUTCMinutes())}`;
}
