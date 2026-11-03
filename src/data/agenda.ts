// Regras da agenda de conversas sobre o plano. Mude aqui; o site e a IA seguem.
export const agenda = {
  duracaoMinutos: 30,
  /** 1 = segunda ... 5 = sexta (0 = domingo, 6 = sábado). */
  diasDaSemana: [1, 2, 3, 4, 5],
  inicio: '09:00',
  fim: '18:00',
  antecedenciaHoras: 4,
  diasAFrente: 14,
  folgaMinutos: 15,
  /** Brasília não tem horário de verão desde 2019: UTC-3 o ano todo. */
  fusoMinutos: -180,
  formatos: ['Ligação ou vídeo pelo WhatsApp', 'Presencial em São Bento do Sul'],
};
