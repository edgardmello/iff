
      const totalSteps = 9;

      const getInitialState = () => ({
        form: {
          proprietario: { nome: '', celular: '', email: '' },
          localizacao: {
            cep: '',
            endereco: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            uf: '',
            ponto_referencia: '',
            padrao_localizacao: '',
          },
          detalhes: {
            cod_iptu: '',
            finalidade: '',
            tipo_imóvel: '',
            padrao_imóvel: '',
            tipo_piso: '',
            posicao_solar: '',
          },
          areas: {
            area_util: '',
            dormitorios: '',
            suítes: '',
            banheiros: '',
            vagas_garagem: '',
            coberta_descoberta: 'N/A',
            vaga_propria: false,
          },
          recursos: {
            imóvel_flags: [],
            armarios: [],
            servicos: [],
            outras_caracteristicas: '',
          },
          predio: {
            nome_condominio: '',
            ano_construcao: '',
            n_andares: '',
            unidades_andar: '',
            torres: '',
          },
          lazerSeguranca: {
            lazer: [],
            comodidades: [],
            seguranca: [],
          },
          valores: { valor_venda: '', valor_condominio: '', valor_iptu: '' },
        },
        currentStep: 1,
      });

      let appState = getInitialState();

      const formCard = document.querySelector('.form-card');
      const alertContainer = document.getElementById('alertContainer');
      const stepItems = document.querySelectorAll('.step-item');
      const stepContents = document.querySelectorAll('.step-content');
      const btnVoltar = document.getElementById('btnVoltar');
      const btnProximo = document.getElementById('btnProximo');
      const propertyForm = document.getElementById('propertyForm');

      function populateFormFields() {
        for (const stepKey in appState.form) {
          for (const fieldKey in appState.form[stepKey]) {
            const value = appState.form[stepKey][fieldKey];
            const field = propertyForm.elements[fieldKey];
            if (!field) continue;

            try {
              if (Array.isArray(value)) {
                const group = propertyForm.elements[fieldKey];
                if (group && group.length > 0) {
                  Array.from(group).forEach((cb) => {
                    cb.checked = value.includes(cb.value);
                  });
                }
              } else if (field.type === 'radio') {
                const group = propertyForm.elements[fieldKey];
                if (group && group.length > 0) {
                  Array.from(group).forEach((radio) => {
                    radio.checked = radio.value === value;
                  });
                }
              } else if (field.type === 'checkbox') {
                field.checked = Boolean(value);
              } else {
                field.value = value || '';
              }
            } catch (e) {
              console.warn(`Erro ao popular campo ${fieldKey}:`, e);
            }
          }
        }
        const ta = document.getElementById('outras_caracteristicas');
        if (ta) updateCharCount(ta);
      }

      function updateState(stepKey, fieldKey, value) {
        if (appState.form[stepKey] !== undefined) {
          appState.form[stepKey][fieldKey] = value;
        }
      }
      function updateRadioState(stepKey, fieldKey, value) {
        updateState(stepKey, fieldKey, value);
      }
      function updateCheckboxState(stepKey, fieldKey, isChecked) {
        updateState(stepKey, fieldKey, isChecked);
      }
      function updateCheckboxGroupState(stepKey, fieldKey, nameAttr) {
        const checkedValues = getCheckedValues(nameAttr);
        updateState(stepKey, fieldKey, checkedValues);
      }
      function getCheckedValues(name) {
        return Array.from(
          document.querySelectorAll(`input[name="${name}"]:checked`)
        ).map((cb) => cb.value);
      }

      document.addEventListener('DOMContentLoaded', function () {
        populateFormFields();
        applyMasks();
        updateProgress();
        setupClickListeners();

        document
          .querySelector('.progress-steps')
          ?.insertAdjacentHTML(
            'beforebegin',
            '<div id="progress-label" class="progress-label"></div>'
          );
      });

      function setupClickListeners() {
        btnVoltar.addEventListener('click', voltarStep);
        btnProximo.addEventListener('click', proximoStep);

        // Adiciona os listeners nos botões de cópia corretos (Mobile e Desktop)
        const btnCopyMobile = document.getElementById('btnCopiarResumoMobile');
        const btnCopyDesktop = document.getElementById('btnCopiarResumoDesktop');

        if (btnCopyMobile) btnCopyMobile.addEventListener('click', copiarResumo);
        if (btnCopyDesktop) btnCopyDesktop.addEventListener('click', copiarResumo);
      }

      function applyMasks() {
        const celular = document.getElementById('celular');
        if (celular) VMasker(celular).maskPattern('(99) 99999-9999');

        const cep = document.getElementById('cep');
        if (cep) VMasker(cep).maskPattern('99999-999');

        ['valor_venda', 'valor_condominio', 'valor_iptu'].forEach((id) => {
          const input = document.getElementById(id);
          if (input)
            VMasker(input).maskMoney({
              precision: 2,
              separator: ',',
              delimiter: '.',
              unit: 'R$',
              zeroCents: false,
            });
        });
      }

      function clearAddressFields() {
        ['endereco', 'bairro', 'cidade', 'uf'].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.value = '';
          updateState('localizacao', id, '');
        });
      }

      function autoCompleteCep() {
        let cep = appState.form.localizacao.cep.replace(/\D/g, '');
        if (cep.length !== 8) return;

        showAlert('info', 'Buscando endereço...');

        fetch(`https://viacep.com.br/ws/${cep}/json/`)
          .then((res) => res.json())
          .then((data) => {
            document
              .querySelectorAll('.alert-info')
              .forEach((el) => el.remove());
            if (!('erro' in data)) {
              const fieldMap = {
                endereco: 'logradouro',
                bairro: 'bairro',
                cidade: 'localidade',
                uf: 'uf',
              };
              Object.keys(fieldMap).forEach((key) => {
                const value = data[fieldMap[key]] || '';
                document.getElementById(key).value = value;
                updateState('localizacao', key, value);
              });
              document.getElementById('numero').focus();
              showAlert('success', 'Endereço encontrado!');
            } else {
              clearAddressFields();
              showAlert('error', 'CEP não encontrado.');
            }
          })
          .catch((error) => {
            document
              .querySelectorAll('.alert-info')
              .forEach((el) => el.remove());
            clearAddressFields();
            showAlert('error', 'Erro ao buscar CEP.');
            console.error('Erro CEP:', error);
          });
      }

      function updateCharCount(ta) {
        document.getElementById('charCount').textContent = Math.min(
          ta.value.length,
          500
        );
      }

      function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
      }

      function validateCurrentStep() {
        const currentStepContent = document.querySelector(
          `.step-content[data-step="${appState.currentStep}"]`
        );
        if (!currentStepContent) return false;

        const required = currentStepContent.querySelectorAll(
          `input[required], select[required], textarea[required]`
        );
        let isValid = true;

        currentStepContent
          .querySelectorAll('.error-message.show')
          .forEach((el) => el.classList.remove('show'));

        required.forEach((input) => {
          const group = input.closest('.form-group');
          const errorMsg = group?.querySelector('.error-message');
          let msg = 'Campo obrigatório.';
          let fieldValid = true;

          if (input.type === 'radio') {
            fieldValid = !!currentStepContent.querySelector(
              `input[name="${input.name}"]:checked`
            );
          } else if (
            input.type === 'email' &&
            input.value.trim() &&
            !validateEmail(input.value.trim())
          ) {
            fieldValid = false;
            msg = 'E-mail inválido.';
          } else if (
            input.type !== 'radio' &&
            input.type !== 'checkbox' &&
            !input.value.trim()
          ) {
            fieldValid = false;
          }

          if (!fieldValid) {
            isValid = false;
            if (errorMsg) {
              errorMsg.textContent = msg;
              errorMsg.classList.add('show');
            }
          }
        });

        return isValid;
      }

      function updateProgress() {
        appState.currentStep = parseInt(appState.currentStep, 10);

        const currentStepLabel =
          stepItems[appState.currentStep - 1]?.textContent.trim() || '';
        const progressLabel = document.getElementById('progress-label');
        if (progressLabel) {
          progressLabel.textContent = `Passo ${appState.currentStep} de ${totalSteps}: ${currentStepLabel}`;
        }

        stepItems.forEach((item) => {
          const step = parseInt(item.dataset.step);
          item.classList.remove('active', 'completed');
          if (step < appState.currentStep) item.classList.add('completed');
          else if (step === appState.currentStep) item.classList.add('active');
        });

        stepContents.forEach((content) =>
          content.classList.toggle(
            'active',
            parseInt(content.dataset.step) === appState.currentStep
          )
        );

        const fill = document.getElementById('progressFill');
        const summary = document.getElementById('progressSummary');
        if (fill) {
          const pct =
            totalSteps > 1
              ? ((appState.currentStep - 1) / (totalSteps - 1)) * 100
              : 100;
          fill.style.width = `${pct}%`;
        }
        if (summary) {
          summary.innerHTML = `Etapa <strong>${appState.currentStep}</strong> de ${totalSteps}`;
        }

        btnVoltar.style.display = appState.currentStep > 1 ? 'flex' : 'none';

        if (appState.currentStep === totalSteps) {
          btnProximo.style.display = 'none';
          // A função de Resumo (Markdown) é chamada aqui
          updateSummary();
        } else {
          btnProximo.style.display = 'flex';
        }

        if (appState.currentStep > 1)
          formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (appState.currentStep > 1 && window.innerWidth <= 768) {
    // Espera o DOM atualizar antes de scrollar
    setTimeout(() => {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }
      }

      function proximoStep() {
        document
          .querySelectorAll('.error-message.show')
          .forEach((el) => el.classList.remove('show'));

        if (validateCurrentStep()) {
          if (appState.currentStep < totalSteps) {
            appState.currentStep++;
            updateProgress();
          }
        } else {
          showAlert('error', 'Corrija os campos inválidos.');
        }
      }
      function voltarStep() {
        if (appState.currentStep > 1) {
          appState.currentStep--;
          updateProgress();
        }
      }

      function collectFormData() {
        const cleanCurrency = (value) =>
          value
            ? value
                .replace('R$', '')
                .replace(/\./g, '')
                .replace(',', '.')
                .trim()
            : '';

        const imóvelData = {
          ...appState.form.detalhes,
          ...appState.form.areas,
          ...appState.form.recursos,
        };

        const condominioData = {
          ...appState.form.predio,
          ...appState.form.lazerSeguranca,
          ponto_referencia: appState.form.localizacao.ponto_referencia,
          padrao_localizacao: appState.form.localizacao.padrao_localizacao,
        };

        const { ponto_referencia, padrao_localizacao, ...localizacaoData } =
          appState.form.localizacao;

        return {
          proprietario: { ...appState.form.proprietario },
          localizacao: localizacaoData,
          caracteristicas: {
            ...imóvelData,
            predio: condominioData,
          },
          valores: {
            pretensao: appState.form.detalhes.finalidade,
            valor_venda: cleanCurrency(appState.form.valores.valor_venda),
            valor_condominio: cleanCurrency(
              appState.form.valores.valor_condominio
            ),
            valor_iptu: cleanCurrency(appState.form.valores.valor_iptu),
          },
        };
      }

      const setText = (id, value, fallback = '-') => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || fallback;
      };
      const setHTML = (id, value, fallback = 'Nenhuma') => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = value || fallback;
      };

      function updateSummary() {
        try {
          const data = collectFormData();
          const formatCurrency = (value) => {
            if (!value) return 'N/I';
            const num = parseFloat(value);
            return isNaN(num)
              ? 'N/I'
              : `R$ ${num.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`;
          };
          const formatList = (list) =>
            !list || list.length === 0
              ? 'Nenhuma'
              : list
                  .map(
                    (item) => `<span class="summary-list-item">${item}</span>`
                  )
                  .join(' ');

          const getText = (value, fallback = '-') => value || fallback;
          const getList = (value) => formatList(value);

          setText('summaryNome', data.proprietario.nome);
          setText('summaryEmail', data.proprietario.email);
          setText('summaryCelular', data.proprietario.celular);
          setText(
            'summaryEndereco',
            `${getText(data.localizacao.endereco, 'N/A')}, ${getText(
              data.localizacao.numero,
              'N/A'
            )} - ${getText(data.localizacao.bairro, 'N/A')}, ${getText(
              data.localizacao.cidade,
              'N/A'
            )} / ${getText(data.localizacao.uf, 'N/A')}`
          );

          setText('summaryTipo', data.caracteristicas.tipo_imóvel);
          setText('summaryFinalidade', data.caracteristicas.finalidade, 'N/I');
          setText(
            'summaryArea',
            data.caracteristicas.area_util
              ? `${data.caracteristicas.area_util} m²`
              : '-'
          );
          setText('summaryCodIptu', data.caracteristicas.cod_iptu, 'N/I');
          setText(
            'summaryQuartos',
            `${getText(data.caracteristicas.dormitorios, 0)}D/${getText(
              data.caracteristicas.suítes,
              0
            )}S/${getText(data.caracteristicas.banheiros, 0)}B`
          );
          const vagas = data.caracteristicas.vagas_garagem;
          const vagaTipo = data.caracteristicas.coberta_descoberta;
          const vagaPropria = data.caracteristicas.vaga_propria
            ? '(P)'
            : '(NP)';
          setText(
            'summaryVagas',
            vagas ? `${vagas}V-${vagaTipo}${vagaPropria}` : 'N/I'
          );
          setText(
            'summaryPadraoImovel',
            data.caracteristicas.padrao_imóvel,
            'N/I'
          );
          setText('summaryTipoPiso', data.caracteristicas.tipo_piso, 'N/I');
          setText(
            'summaryPosicaoSolar',
            data.caracteristicas.posicao_solar,
            'N/I'
          );
          setText(
            'summaryOutrasCaracteristicas',
            data.caracteristicas.outras_caracteristicas,
            'Nenhuma'
          );
          setHTML(
            'summaryImovelFlags',
            getList(data.caracteristicas.imóvel_flags)
          );
          setHTML('summaryArmarios', getList(data.caracteristicas.armarios));
          setHTML('summaryServicos', getList(data.caracteristicas.servicos));

          setText(
            'summaryCondoNome',
            data.caracteristicas.predio.nome_condominio,
            'N/I'
          );
          setText(
            'summaryCondoAno',
            data.caracteristicas.predio.ano_construcao,
            'N/I'
          );
          setText(
            'summaryPadraoLocalizacao',
            data.caracteristicas.predio.padrao_localizacao,
            'N/I'
          );
          setText(
            'summaryPontoReferencia',
            data.caracteristicas.predio.ponto_referencia,
            'N/I'
          );
          setText(
            'summaryAndares',
            data.caracteristicas.predio.n_andares,
            'N/I'
          );
          setText(
            'summaryUnidadesAndar',
            data.caracteristicas.predio.unidades_andar,
            'N/I'
          );
          setText('summaryTorres', data.caracteristicas.predio.torres, 'N/I');
          setHTML('summaryLazer', getList(data.caracteristicas.predio.lazer));
          setHTML(
            'summaryComodidades',
            getList(data.caracteristicas.predio.comodidades)
          );
          setHTML(
            'summarySeguranca',
            getList(data.caracteristicas.predio.seguranca)
          );

          setText(
            'summaryValor',
            formatCurrency(data.valores.valor_venda) || '-'
          );
          setText(
            'summaryCondoValor',
            formatCurrency(data.valores.valor_condominio)
          );
          setText('summaryIptuValor', formatCurrency(data.valores.valor_iptu));
        } catch (error) {
          console.error('Erro ao atualizar resumo:', error);
          showAlert('error', 'Erro ao gerar resumo.');
        }
      }

      async function copiarResumo() {
        try {
          const data = collectFormData();

          let textToCopy = '## 📋 Resumo do Cadastro do Imóvel\n\n';

          textToCopy += '### 👤 Proprietário\n';
          textToCopy += `* **Nome:** ${data.proprietario?.nome || 'N/I'}\n`;
          textToCopy += `* **Email:** ${data.proprietario?.email || 'N/I'}\n`;
          textToCopy += `* **Celular:** ${
            data.proprietario?.celular || 'N/I'
          }\n\n`;

          textToCopy += '### 📍 Localização\n';
          const loc = data.localizacao || {};
          const endereco = `${loc.endereco || ''}, ${loc.numero || ''}${
            loc.complemento ? ' - ' + loc.complemento : ''
          } - ${loc.bairro || ''}, ${loc.cidade || ''}/${loc.uf || ''}`.trim();
          textToCopy += `* **Endereço:** ${endereco}\n`;

          if (loc.cep) {
            textToCopy += `* **CEP:** ${loc.cep}\n`;
          }

          const predio = data.caracteristicas?.predio || {};
          if (predio.padrao_localizacao) {
            textToCopy += `* **Padrão Local:** ${predio.padrao_localizacao}\n`;
          }
          if (predio.ponto_referencia) {
            textToCopy += `* **Referência:** ${predio.ponto_referencia}\n`;
          }
          textToCopy += '\n';

          const caract = data.caracteristicas || {};
          textToCopy += '### 🏠 Imóvel\n';
          textToCopy += `* **Tipo:** ${caract.tipo_imóvel || 'N/I'}\n`;
          textToCopy += `* **Finalidade:** ${caract.finalidade || 'N/I'}\n`;

          if (caract.padrao_imóvel) {
            textToCopy += `* **Padrão:** ${caract.padrao_imóvel}\n`;
          }

          if (caract.area_util) {
            textToCopy += `* **Área Útil:** ${caract.area_util} m²\n`;
          }

          const config = `${caract.dormitorios || 0}D ${caract.suítes || 0}S ${
            caract.banheiros || 0
          }B`;
          textToCopy += `* **Configuração:** ${config}\n`;
          textToCopy += `* **Vagas:** ${caract.vagas_garagem || 0}\n`;

          if (caract.vaga_propria) {
            textToCopy += `* **Vaga Própria:** ${caract.vaga_propria}\n`;
          }

          if (caract.coberta_descoberta) {
            textToCopy += `* **Vaga:** ${caract.coberta_descoberta}\n`;
          }

          if (caract.armarios) {
            textToCopy += `* **Armários:** ${caract.armarios}\n`;
          }

          if (caract.tipo_piso) {
            textToCopy += `* **Tipo de Piso:** ${caract.tipo_piso}\n`;
          }

          if (caract.posicao_solar) {
            textToCopy += `* **Posição Solar:** ${caract.posicao_solar}\n`;
          }

          if (caract.ano_construcao) {
            textToCopy += `* **Ano Construção:** ${caract.ano_construcao}\n`;
          }

          textToCopy += '\n';

          const valores = data.valores || {};
          textToCopy += '### 💰 Valores\n';

          if (valores.valor_venda) {
            textToCopy += `* **Valor Venda:** R$ ${valores.valor_venda}\n`;
          }
          if (valores.valor_condominio) {
            textToCopy += `* **Condomínio:** R$ ${valores.valor_condominio}\n`;
          }
          if (valores.valor_iptu) {
            textToCopy += `* **IPTU:** R$ ${valores.valor_iptu}\n`;
          }
          if (loc.cod_iptu) {
            textToCopy += `* **Código IPTU:** ${loc.cod_iptu}\n`;
          }
          textToCopy += '\n';

          if (caract.imóvel_flags && caract.imóvel_flags.length > 0) {
            textToCopy += '### ✨ Características\n';
            caract.imóvel_flags.forEach((item) => {
              textToCopy += `* ${item}\n`;
            });
            textToCopy += '\n';
          }

          if (caract.servicos && caract.servicos.length > 0) {
            textToCopy += '### 🛠️ Serviços\n';
            textToCopy += `* ${caract.servicos.join(', ')}\n\n`;
          }

          if (
            predio.nome_condominio ||
            predio.lazer ||
            predio.comodidades ||
            predio.seguranca
          ) {
            textToCopy += '### 🏢 Condomínio\n';

            if (predio.nome_condominio) {
              textToCopy += `* **Nome:** ${predio.nome_condominio}\n`;
            }

            if (predio.torres) {
              textToCopy += `* **Torres:** ${predio.torres}\n`;
            }

            if (predio.n_andares) {
              textToCopy += `* **Andares:** ${predio.n_andares}\n`;
            }

            if (predio.unidades_andar) {
              textToCopy += `* **Unidades/Andar:** ${predio.unidades_andar}\n`;
            }

            if (predio.lazer && predio.lazer.length > 0) {
              textToCopy += `* **Lazer:** ${predio.lazer.join(', ')}\n`;
            }

            if (predio.comodidades && predio.comodidades.length > 0) {
              textToCopy += `* **Comodidades:** ${predio.comodidades.join(
                ', '
              )}\n`;
            }

            if (predio.seguranca && predio.seguranca.length > 0) {
              textToCopy += `* **Segurança:** ${predio.seguranca.join(', ')}\n`;
            }

            textToCopy += '\n';
          }

          if (caract.outras_caracteristicas) {
            textToCopy += '### 📝 Observações\n';
            textToCopy += `${caract.outras_caracteristicas}\n\n`;
          }

          if (navigator.share) {
            try {
              await navigator.share({
                title: '📋 Cadastro de Imóvel',
                text: textToCopy,
              });

              if (typeof vibrate === 'function') vibrate();
              showAlert('success', '✅ Resumo compartilhado com sucesso!');
              return;
            } catch (shareError) {
              if (shareError.name === 'AbortError') {
                console.log('Compartilhamento cancelado');
                return;
              }
            }
          }

          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(textToCopy);
            if (typeof vibrate === 'function') vibrate();
            showAlert('success', '✅ Resumo copiado!');
            return;
          }

          const textArea = document.createElement('textarea');
          textArea.value = textToCopy;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          try {
            document.execCommand('copy');
            if (typeof vibrate === 'function') vibrate();
            showAlert('success', '✅ Resumo copiado!');
          } catch (err) {
            showAlert('error', '❌ Erro ao copiar.');
          }

          document.body.removeChild(textArea);
        } catch (err) {
          console.error('Erro detalhado:', err);
          showAlert('error', `❌ Erro: ${err.message}`);
        }
      }

      function vibrate() {
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      }

      function showAlert(type, message) {
        alertContainer.innerHTML = '';
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} show`;
        alert.textContent = message;
        alertContainer.appendChild(alert);
        const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(
          navigator.userAgent
        );
        const displayTime = isMobile ? 4000 : 5000;

        setTimeout(() => {
          alert.style.opacity = '0';
          setTimeout(() => alert.remove(), 300);
        }, displayTime);
      }

      function stepChange(btn, delta) {
        const wrapper = btn.closest('.stepper-group');
        if (!wrapper) return;
        const input = wrapper.querySelector('input[type="number"]');
        if (!input) return;

        let value = parseInt(input.value) || 0;
        const min =
          input.min !== '' ? parseInt(input.min) : Number.MIN_SAFE_INTEGER;
        const max =
          input.max !== '' ? parseInt(input.max) : Number.MAX_SAFE_INTEGER;
        let newValue = value + delta;

        if (newValue < min) newValue = min;
        if (newValue > max) newValue = max;

        input.value = newValue;

        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      }

      function toggleRequired(enable = true, selectors = []) {
        let inputs;
        if (selectors && selectors.length > 0) {
          inputs = selectors
            .map((sel) => Array.from(document.querySelectorAll(sel)))
            .flat();
        } else {
          const form = document.querySelector('form') || document.body;
          inputs = Array.from(form.querySelectorAll('input, select, textarea'));
        }

        inputs.forEach((el) => {
          if (enable) {
            el.setAttribute('required', 'required');
            el.classList.add('required-active');
          } else {
            el.removeAttribute('required');
            el.classList.remove('required-active');
          }
        });

        showToast(
          enable ? 'Campos tornados obrigatórios' : 'Campos sem obrigatoriedade'
        );
      }

      window.requiredEnabled =
        typeof window.requiredEnabled !== 'undefined'
          ? window.requiredEnabled
          : false;
      function toggleRequiredMode() {
        window.requiredEnabled = !window.requiredEnabled;
        toggleRequired(window.requiredEnabled);
        showToast(
          'Modo: ' +
            (window.requiredEnabled ? 'Obrigatório ON' : 'Obrigatório OFF')
        );
      }

      document.addEventListener('DOMContentLoaded', function () {
        const icon = document.getElementById('toggleRequiredIcon');
        if (icon) {
          icon.addEventListener('click', function (e) {
            e.preventDefault();
            toggleRequiredMode();
            icon.classList.add('scale-110');
            setTimeout(() => icon.classList.remove('scale-110'), 220);
          });
        }

        toggleRequired(window.requiredEnabled);
      });

      // ADICIONE esta função
function debounce(func, wait) {
  let timeout;
  return function executed(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Aplique em campos de texto
const debouncedValidate = debounce(() => {
  if (appState.currentStep === totalSteps) updateSummary();
}, 300);

// Adicione nos eventos onchange dos inputs
onchange="updateState(...); debouncedValidate();"

      function showToast(message, ms = 1800) {
        const toast = document.getElementById('microToast');
        if (!toast) {
          console.log(message);
          return;
        }
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(window._microToastTimeout);
        window._microToastTimeout = setTimeout(() => {
          toast.classList.remove('show');
        }, ms);
      }
