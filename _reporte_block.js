      function reporteFechaISO(val) {
          if (!val) return null;
          try {
              const d = new Date(val);
              if (isNaN(d.getTime())) return null;
              return d.toISOString().split('T')[0];
          } catch (_) {
              return null;
          }
      }

      function reporteEtiquetaDiaLargo(isoKey) {
          if (!isoKey) return 'Sin fecha';
          const d = new Date(isoKey + 'T12:00:00');
          if (isNaN(d.getTime())) return isoKey;
          const dia = d.toLocaleDateString('es-MX', { weekday: 'long' });
          const diaCap = dia.charAt(0).toUpperCase() + dia.slice(1);
          const fechaCorta = d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
          return diaCap + ' ' + fechaCorta;
      }

      function reporteRangoSemanaPasada() {
          const hoy = new Date();
          hoy.setHours(12, 0, 0, 0);
          const dow = hoy.getDay();
          const lunesEstaSemana = new Date(hoy);
          lunesEstaSemana.setDate(hoy.getDate() - (dow === 0 ? 6 : dow - 1));
          const domingoPasado = new Date(lunesEstaSemana);
          domingoPasado.setDate(lunesEstaSemana.getDate() - 1);
          const lunesPasado = new Date(domingoPasado);
          lunesPasado.setDate(domingoPasado.getDate() - 6);
          const dias = [];
          for (let i = 0; i < 7; i++) {
              const d = new Date(lunesPasado);
              d.setDate(lunesPasado.getDate() + i);
              dias.push(reporteFechaISO(d));
          }
          return {
              inicioISO: dias[0],
              finISO: dias[6],
              dias: dias,
              etiqueta: reporteEtiquetaDiaLargo(dias[0]) + ' al ' + reporteEtiquetaDiaLargo(dias[6])
          };
      }

      function reporteFiltrarPorSupervisor(registros, supFiltro) {
          if (!supFiltro) return registros;
          return registros.filter(r => r.supervisora === supFiltro);
      }

      function reporteHtmlCalendarioSemanaPasada(registros, supFiltro) {
          const rango = reporteRangoSemanaPasada();
          const base = reporteFiltrarPorSupervisor(registros, supFiltro);
          const citasSemana = base.filter(r => {
              const k = reporteFechaISO(r.diaEvento);
              return k && k >= rango.inicioISO && k <= rango.finISO;
          });
          let maxTotalDia = 0;
          const porDia = {};
          rango.dias.forEach(iso => { porDia[iso] = { total: 0, bases: {} }; });
          citasSemana.forEach(c => {
              const k = reporteFechaISO(c.diaEvento);
              if (!k || !porDia[k]) return;
              const baseNombre = (c.baseDatos || '').trim() || 'Sin base';
              porDia[k].total += 1;
              porDia[k].bases[baseNombre] = (porDia[k].bases[baseNombre] || 0) + 1;
          });
          rango.dias.forEach(iso => {
              if (porDia[iso].total > maxTotalDia) maxTotalDia = porDia[iso].total;
          });

          let html = '<div class="analisis-container" style="background:#fff;border-left-color:#4a2b7a;">' +
              '<h4>📆 Semana pasada — bases que sirvieron</h4>' +
              '<p style="margin:0 0 10px;font-size:0.9rem;color:#475569;">' + segEscapeHtml(rango.etiqueta) + ' · ' + citasSemana.length + ' cita(s) en total</p>' +
              '<div class="reporte-semana-grid">';
          rango.dias.forEach(iso => {
              const info = porDia[iso];
              const ranking = Object.entries(info.bases).sort((a, b) => b[1] - a[1]);
              const esTop = info.total > 0 && info.total === maxTotalDia;
              const claseCelda = info.total === 0 ? 'reporte-dia-celda reporte-dia-celda--vacio' : (esTop ? 'reporte-dia-celda reporte-dia-celda--top' : 'reporte-dia-celda');
              html += '<div class="' + claseCelda + '"><div class="reporte-dia-titulo">' + segEscapeHtml(reporteEtiquetaDiaLargo(iso)) + '</div>';
              if (info.total === 0) {
                  html += '<div>Sin citas</div>';
              } else {
                  html += '<div style="margin-bottom:4px;font-weight:600;">' + info.total + ' cita(s)</div>';
                  ranking.slice(0, 3).forEach((par, idx) => {
                      html += '<div class="reporte-base-linea">' + (idx === 0 ? '🏆 ' : '• ') + segEscapeHtml(par[0]) + ': <strong>' + par[1] + '</strong></div>';
                  });
                  if (ranking.length > 3) {
                      html += '<div class="reporte-base-linea" style="color:#64748b;">+' + (ranking.length - 3) + ' base(s) más</div>';
                  }
              }
              html += '</div>';
          });
          html += '</div></div>';
          return html;
      }

      function reporteHtmlCitasPorDia(citasProximas, hoyISO, mananaISO) {
          const countsPorDia = {};
          citasProximas.forEach(cita => {
              const key = reporteFechaISO(cita.diaEvento);
              if (!key) return;
              countsPorDia[key] = (countsPorDia[key] || 0) + 1;
          });
          const diasOrdenados = Object.keys(countsPorDia).sort();
          const total = citasProximas.length;
          const nManana = countsPorDia[mananaISO] || 0;

          let html = '<div style="margin-bottom:16px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">' +
              '<h4 style="margin:0 0 10px;color:#0a2540;">📅 Citas por día del evento</h4>';
          if (nManana > 0) {
              html += '<p style="margin:0 0 10px;padding:10px;background:#e8f5e9;border-radius:10px;"><strong>Para mañana (' +
                  segEscapeHtml(reporteEtiquetaDiaLargo(mananaISO)) + '):</strong> ' + nManana + ' cita' + (nManana === 1 ? '' : 's') + '</p>';
          } else {
              html += '<p style="margin:0 0 10px;padding:10px;background:#fff7ed;border-radius:10px;color:#9a3412;"><strong>Mañana (' +
                  segEscapeHtml(reporteEtiquetaDiaLargo(mananaISO)) + '):</strong> sin citas agendadas por ahora.</p>';
          }
          html += '<p style="margin:0 0 8px;"><strong>Total próximos 7 días:</strong> ' + total + '</p>';
          if (diasOrdenados.length === 0) {
              html += '<p style="margin:0;">No hay citas en los próximos 7 días.</p>';
          } else {
              const frases = diasOrdenados.map(key => {
                  const n = countsPorDia[key];
                  let pref = '';
                  if (key === hoyISO) pref = ' (hoy)';
                  else if (key === mananaISO) pref = ' (mañana)';
                  return '<strong>' + n + '</strong> cita' + (n === 1 ? '' : 's') + ' el <strong>' + segEscapeHtml(reporteEtiquetaDiaLargo(key)) + '</strong>' + pref;
              });
              html += '<p style="margin:8px 0 0;line-height:1.6;">' + frases.join(' · ') + '</p><ul style="margin:10px 0 0;padding-left:20px;">';
              diasOrdenados.forEach(key => {
                  html += '<li>' + countsPorDia[key] + ' — ' + segEscapeHtml(reporteEtiquetaDiaLargo(key)) + '</li>';
              });
              html += '</ul>';
          }
          html += '</div>';
          return html;
      }

      function reporteHtmlOperadores(citasProximas) {
          const porOperador = {};
          citasProximas.forEach(c => {
              const op = (c.operador || '').trim() || 'Sin operador';
              if (!porOperador[op]) porOperador[op] = { count: 0, bases: {} };
              porOperador[op].count += 1;
              const b = (c.baseDatos || '').trim() || 'Sin base';
              porOperador[op].bases[b] = (porOperador[op].bases[b] || 0) + 1;
          });
          const lista = Object.entries(porOperador).sort((a, b) => b[1].count - a[1].count);
          let html = '<div class="analisis-container" style="background:#faf5ff;border-left-color:#7c3aed;">' +
              '<h4>👤 Operadores que sacaron cita (próximos 7 días)</h4>';
          if (!lista.length) {
              html += '<p style="margin:0;">Ningún operador con citas en este periodo.</p>';
          } else {
              html += '<table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:0.9rem;">' +
                  '<thead><tr style="background:#4a2b7a;color:#fff;">' +
                  '<th style="padding:8px;text-align:left;">Operador</th>' +
                  '<th style="padding:8px;text-align:center;">Citas</th>' +
                  '<th style="padding:8px;text-align:left;">Bases (conteo)</th></tr></thead><tbody>';
              lista.forEach(([op, info]) => {
                  const basesTxt = Object.entries(info.bases)
                      .sort((a, b) => b[1] - a[1])
                      .map(bpar => segEscapeHtml(bpar[0]) + ' (' + bpar[1] + ')')
                      .join(', ');
                  html += '<tr style="border-bottom:1px solid #e2e8f0;">' +
                      '<td style="padding:8px;">' + segEscapeHtml(op) + '</td>' +
                      '<td style="padding:8px;text-align:center;font-weight:700;">' + info.count + '</td>' +
                      '<td style="padding:8px;">' + basesTxt + '</td></tr>';
              });
              html += '</tbody></table>';
          }
          html += '</div>';
          return html;
      }

      function mostrarReporteCitas() {
          const supFiltro = document.getElementById('reporteCitasSupervisorFiltro') ? document.getElementById('reporteCitasSupervisorFiltro').value : '';
          const hoyISO = reporteFechaISO(new Date());
          const mananaDate = new Date();
          mananaDate.setDate(mananaDate.getDate() + 1);
          const mananaISO = reporteFechaISO(mananaDate);
          const limiteDate = new Date();
          limiteDate.setDate(limiteDate.getDate() + 7);
          const limiteISO = reporteFechaISO(limiteDate);

          const citasProximas = window.registrosPremanifiesto.filter(registro => {
              const key = reporteFechaISO(registro.diaEvento);
              if (!key || !hoyISO || !limiteISO) return false;
              if (key < hoyISO || key > limiteISO) return false;
              if (supFiltro && registro.supervisora !== supFiltro) return false;
              return true;
          }).sort((a, b) => new Date(a.diaEvento) - new Date(b.diaEvento));

          const analisis = generarAnalisisBases(citasProximas);
          const totalCitasSup = citasProximas.length;

          let html = '';
          if (supFiltro) {
              html += '<p style="margin-bottom:12px;padding:10px;background:#e8f0fe;border-radius:10px;"><strong>Filtro activo:</strong> solo citas de <strong>' +
                  segEscapeHtml(supFiltro) + '</strong> (próximos 7 días y semana pasada).</p>';
          }

          html += reporteHtmlCitasPorDia(citasProximas, hoyISO, mananaISO);
          html += reporteHtmlCalendarioSemanaPasada(window.registrosPremanifiesto, supFiltro);
          html += reporteHtmlOperadores(citasProximas);

          html += '<div style="margin-bottom:16px;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">';
          if (supFiltro) {
              html += '<p style="margin:0 0 8px;"><strong>Supervisor:</strong> ' + segEscapeHtml(supFiltro) + ' (' + totalCitasSup + ' citas)</p>';
          }
          html += '<p style="margin:0 0 8px;"><strong>Resumen citas próximas:</strong> ' + totalCitasSup + '</p></div>';

          html += '<div class="analisis-container">' +
              '<h4>📊 ANÁLISIS DE RENDIMIENTO</h4>' +
              '<p><strong>👥 Supervisor con mayor volumen:</strong> ' + (analisis.supervisorTop || 'Ninguno') + ' (' + analisis.maxSup + ' citas)</p>' +
              '<p><strong>📋 Total de citas en los próximos 7 días:</strong> ' + analisis.totalCitas + '</p>' +
              '<p><strong>🏆 Ranking de Bases de Datos:</strong></p><ul>';
          analisis.baseRanking.forEach(b => {
              html += '<li>' + segEscapeHtml(b.base) + ': ' + b.count + ' citas (' + b.porcentaje + '%)</li>';
          });
          html += '</ul><div class="recomendacion">' + analisis.recomendacion + '</div></div>';

          if (citasProximas.length === 0) {
              html += '<p>No hay citas programadas para los próximos 7 días.</p>';
          } else {
              html += '<h4>📅 Citas programadas:</h4>' +
                  '<table style="width:100%; border-collapse:collapse;"><thead><tr style="background:#0a2540; color:white;">' +
                  '<th>Fecha</th><th>Hora</th><th>Nombre</th><th>Teléfono</th><th>Hotel</th><th>Base</th><th>Operador</th><th>Supervisor</th>' +
                  '</tr></thead><tbody>';
              citasProximas.forEach(cita => {
                  html += '<tr>' +
                      '<td>' + segEscapeHtml(cita.diaEvento || '') + '</td>' +
                      '<td>' + segEscapeHtml(cita.hora || '') + '</td>' +
                      '<td>' + segEscapeHtml(cita.nombre || '') + '</td>' +
                      '<td>' + segEscapeHtml(cita.telefono || '') + '</td>' +
                      '<td>' + segEscapeHtml(cita.hotel || '') + '</td>' +
                      '<td>' + segEscapeHtml(cita.baseDatos || '') + '</td>' +
                      '<td>' + segEscapeHtml(cita.operador || '') + '</td>' +
                      '<td>' + segEscapeHtml(cita.supervisora || '') + '</td></tr>';
              });
              html += '</tbody></table>';
          }

          document.getElementById('contenidoReporteCitas').innerHTML = html;
      }
      
