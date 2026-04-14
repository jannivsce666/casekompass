(function () {
  if (typeof window === 'undefined' || window.location.protocol === 'file:') return;

  const WEB3FORMS_ACCESS_KEY = '0697e1bf-0224-41c9-b952-bf80dea963ef';
  const DRAFT_STORAGE_KEY = 'casekompass-planning-draft-v1';
  const ORDER_STORAGE_KEY = 'casekompass-planning-orders-v1';
  const DISPATCHED_STORAGE_KEY = 'casekompass-planning-dispatched-v1';
  const DB_NAME = 'casekompass-planning-db';
  const FILE_STORE = 'files';
  const MAX_UPLOAD_COUNT = 6;
  const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

  function textField(id, label, options) {
    return { id, label, type: 'text', ...options };
  }

  function textareaField(id, label, options) {
    return { id, label, type: 'textarea', rows: 4, ...options };
  }

  function radioField(id, label, options) {
    return { id, label, type: 'radio', options, required: true };
  }

  function yesNoField(id, label, extra) {
    return { id, label, type: 'radio', options: ['Ja', 'Nein'], ...extra };
  }

  function checkboxField(id, label, options, extra) {
    return { id, label, type: 'checkbox', options, ...extra };
  }

  const SECTIONS = [
    {
      title: 'Grunddaten',
      intro: 'Basisdaten der betroffenen Person und formale Ausgangslage.',
      fields: [
        textField('firstName', 'Vorname', { required: true }),
        textField('lastName', 'Nachname', { required: true }),
        { id: 'birthDate', label: 'Geburtsdatum', type: 'date', required: true },
        textField('addressLine', 'Adresse', { required: true, wide: true, placeholder: 'Straße und Hausnummer' }),
        textField('postalCode', 'PLZ', { required: true }),
        textField('city', 'Ort', { required: true }),
        { id: 'phone', label: 'Telefonnummer', type: 'tel', required: true, placeholder: '0152...' },
        { id: 'email', label: 'E-Mail', type: 'email', required: true, placeholder: 'name@beispiel.de' },
        textField('insuranceProvider', 'Kranken- oder Pflegekasse', { required: true, wide: true }),
        yesNoField('hasCareLevel', 'Pflegegrad vorhanden?', { required: true }),
        textField('careLevelValue', 'Falls ja: welcher Pflegegrad?', { placeholder: 'z. B. Pflegegrad 2' }),
        yesNoField('hasDisabilityCard', 'Schwerbehindertenausweis vorhanden?', { required: true }),
        yesNoField('hasLegalSupport', 'Gesetzliche Betreuung oder Vollmacht vorhanden?', { required: true }),
      ],
    },
    {
      title: 'Wer füllt aus?',
      intro: 'Wer die Angaben macht, ist für Rückfragen und Einschätzung wichtig.',
      fields: [
        radioField('filledByRole', 'Wer füllt das Formular aus?', ['Betroffene Person selbst', 'Angehöriger', 'Bevollmächtigter', 'Gesetzlicher Betreuer', 'Sonstige Bezugsperson']),
        textareaField('filledByContact', 'Name und Kontaktdaten dieser Person', { required: true, wide: true, placeholder: 'Name, Telefon, E-Mail und Beziehung zur betroffenen Person' }),
      ],
    },
    {
      title: 'Hauptsituation',
      intro: 'Worum geht es aktuell und warum wird jetzt Hilfe benötigt?',
      fields: [
        textareaField('requestReason', 'Was ist der Grund der Anfrage?', { required: true, wide: true }),
        textareaField('mainProblem', 'Was ist aktuell das größte Problem?', { required: true, wide: true }),
        textField('situationSince', 'Seit wann besteht die Situation?', { required: true }),
        yesNoField('recentlyWorsened', 'Hat sich die Lage kürzlich verschlechtert?', { required: true }),
        textareaField('recentHospitalRehabFall', 'Gab es Krankenhaus, Reha oder Sturz in letzter Zeit?', { wide: true, placeholder: 'Wenn ja: kurz mit Zeitraum und Folgen beschreiben' }),
      ],
    },
    {
      title: 'Diagnosen & Gesundheit',
      intro: 'Die gesundheitliche Lage bestimmt den Versorgungsbedarf direkt mit.',
      fields: [
        textareaField('mainDiagnoses', 'Wichtigste Diagnosen', { required: true, wide: true }),
        textareaField('physicalLimitations', 'Körperliche Einschränkungen', { wide: true }),
        textareaField('psychologicalBurden', 'Psychische Belastungen', { wide: true }),
        textareaField('cognitiveLimitations', 'Kognitive Einschränkungen', { wide: true }),
        textareaField('dementiaIssues', 'Demenz, Vergesslichkeit oder Orientierungsschwierigkeiten', { wide: true }),
        textareaField('painIssues', 'Schmerzen', { wide: true }),
        textareaField('sensoryIssues', 'Seh- oder Hörprobleme', { wide: true }),
        yesNoField('hasIncontinence', 'Inkontinenz?', { required: true }),
        yesNoField('hasSwallowingIssues', 'Schluckstörungen?', { required: true }),
      ],
    },
    {
      title: 'Mobilität',
      intro: 'Wie selbstständig ist Bewegung im Alltag aktuell noch möglich?',
      fields: [
        yesNoField('canStandUpAlone', 'Selbstständig aufstehen möglich?', { required: true }),
        yesNoField('canWalkIndoors', 'Gehen in der Wohnung möglich?', { required: true }),
        yesNoField('canWalkOutsideAlone', 'Draußen allein möglich?', { required: true }),
        yesNoField('canUseStairs', 'Treppen möglich?', { required: true }),
        checkboxField('mobilityAids', 'Vorhandene Hilfsmittel', ['Rollator', 'Rollstuhl', 'Gehstock', 'Pflegebett', 'Toilettenstuhl', 'Haltegriffe'], { wide: true }),
        textareaField('fallRisk', 'Sturzgefahr?', { wide: true, placeholder: 'Wie zeigt sie sich? Gab es bereits Stürze?' }),
        textareaField('transferSupport', 'Transfer-Hilfe nötig? z. B. Bett, Toilette, Dusche', { wide: true }),
      ],
    },
    {
      title: 'Selbstversorgung',
      intro: 'Wo ist Hilfe im Alltag bereits nötig und wo funktionieren Dinge noch?',
      fields: [
        textareaField('dailyLimitations', 'Größte Alltagseinschränkungen', { required: true, wide: true }),
        textareaField('helpWashing', 'Hilfe bei Waschen oder Duschen', { wide: true }),
        textareaField('helpDressing', 'Hilfe beim Anziehen', { wide: true }),
        textareaField('helpEating', 'Hilfe beim Essen oder Trinken', { wide: true }),
        textareaField('helpToilet', 'Hilfe beim Toilettengang', { wide: true }),
        textareaField('helpMedication', 'Hilfe bei Medikamenten', { wide: true }),
        textareaField('helpHousehold', 'Hilfe bei Haushaltsführung', { wide: true }),
        textareaField('helpShopping', 'Hilfe bei Einkaufen', { wide: true }),
        textareaField('helpCooking', 'Hilfe bei Kochen', { wide: true }),
        textareaField('helpCleaningLaundry', 'Hilfe bei Ordnung, Wäsche oder Reinigung', { wide: true }),
      ],
    },
    {
      title: 'Kognition & Sicherheit',
      intro: 'Hier geht es um Orientierung, Verhalten und potenzielle Risiken im Alltag.',
      fields: [
        yesNoField('forgetsMedication', 'Vergisst Medikamente?', { required: true }),
        yesNoField('forgetsAppointments', 'Vergisst Termine?', { required: true }),
        yesNoField('missesDanger', 'Erkennt Gefahren nicht?', { required: true }),
        yesNoField('nighttimeUnrest', 'Nächtliche Unruhe?', { required: true }),
        yesNoField('wanderingRisk', 'Weglauftendenz?', { required: true }),
        textareaField('stressBehavior', 'Ängste, Aggression oder Überforderung', { wide: true }),
        yesNoField('needsSupervision', 'Braucht Beaufsichtigung?', { required: true }),
        yesNoField('understandsLetters', 'Kann Schriftstücke oder Briefe noch verstehen?', { required: true }),
      ],
    },
    {
      title: 'Bestehende Versorgung',
      intro: 'Was ist bereits organisiert und wo reißt die Versorgung noch auf?',
      fields: [
        textareaField('currentHelpers', 'Wer hilft aktuell?', { required: true, wide: true }),
        checkboxField('helperTypes', 'Welche Unterstützung ist aktuell eingebunden?', ['Angehörige', 'Nachbarn', 'Pflegedienst', 'Haushaltshilfe', 'Ergotherapie', 'Physiotherapie', 'Logopädie', 'Tagespflege', 'Essen auf Rädern', 'Hausnotruf', 'Betreuungsdienst'], { wide: true }),
        textareaField('helperFrequency', 'Wie oft kommt wer?', { wide: true }),
        textareaField('whatWorksWell', 'Was funktioniert gut?', { wide: true }),
        textareaField('currentGaps', 'Wo gibt es Versorgungslücken oder was fehlt aktuell?', { required: true, wide: true }),
      ],
    },
    {
      title: 'Wichtige Kontakte',
      intro: 'Hier sammeln Sie alle medizinischen und organisatorischen Ansprechpersonen.',
      fields: [
        textField('familyDoctor', 'Hausarzt', { wide: true }),
        textareaField('specialists', 'Fachärzte', { wide: true }),
        textareaField('therapists', 'Therapeuten', { wide: true }),
        textField('pharmacy', 'Apotheke', { wide: true }),
        textField('medicalSupplyStore', 'Sanitätshaus', { wide: true }),
        textareaField('careServiceContact', 'Pflegedienst oder weitere Dienste', { wide: true }),
        textareaField('clinicContact', 'Ansprechpartner in Klinik, Reha oder Sozialdienst', { wide: true }),
        textareaField('relativeContacts', 'Wichtige Angehörige mit Telefonnummern', { wide: true }),
      ],
    },
    {
      title: 'Anträge & Bescheide',
      intro: 'Welche Anträge laufen schon und welche Bescheide oder Ablehnungen gibt es?',
      fields: [
        yesNoField('careLevelApplied', 'Pflegegrad beantragt?', { required: true }),
        textField('careLevelExisting', 'Pflegegrad vorhanden, welcher?', { wide: true }),
        yesNoField('objectionRunning', 'Widerspruch aktuell?', { required: true }),
        yesNoField('aidsApplied', 'Hilfsmittel beantragt?', { required: true }),
        yesNoField('rehabApplied', 'Reha beantragt?', { required: true }),
        yesNoField('homeAdaptationApplied', 'Wohnraumanpassung beantragt?', { required: true }),
        yesNoField('reliefAmountUsed', 'Entlastungsbetrag genutzt?', { required: true }),
        yesNoField('careAidsUsed', 'Pflegehilfsmittel genutzt?', { required: true }),
        yesNoField('shortTermCareUsed', 'Verhinderungspflege oder Kurzzeitpflege schon genutzt?', { required: true }),
        textareaField('availableDocuments', 'Welche Unterlagen oder Bescheide liegen schon vor?', { required: true, wide: true }),
        textareaField('rejectedItems', 'Was wurde schon abgelehnt?', { wide: true }),
      ],
    },
    {
      title: 'Wohnsituation',
      intro: 'Die Wohnumgebung entscheidet oft mit darüber, was sofort verbessert werden sollte.',
      fields: [
        textField('livingSituation', 'Lebt die Person allein oder mit jemandem?', { required: true, wide: true }),
        { id: 'housingType', label: 'Wohnung oder Haus?', type: 'select', required: true, options: ['Wohnung', 'Haus', 'Sonstiges'] },
        textField('floor', 'Stockwerk', {}),
        yesNoField('hasElevator', 'Aufzug vorhanden?', { required: true }),
        yesNoField('hasAccessibleBathroom', 'Bad barrierefrei?', { required: true }),
        yesNoField('hasStairsAtHome', 'Treppen im Haus?', { required: true }),
        { id: 'bathSetup', label: 'Dusche oder Badewanne?', type: 'select', required: true, options: ['Dusche', 'Badewanne', 'Beides', 'Sonstiges'] },
        yesNoField('bedAccessible', 'Bett oder Schlafzimmer gut erreichbar?', { required: true }),
        textareaField('tripHazards', 'Gibt es Stolperfallen?', { wide: true }),
        yesNoField('renovationUseful', 'Wäre Umbau sinnvoll?', { required: true }),
        textareaField('petsAndAccess', 'Haustiere vorhanden? Ländlich oder städtisch? Gute Erreichbarkeit?', { wide: true }),
      ],
    },
    {
      title: 'Ziele der Familie',
      intro: 'Das Zielbild ist der wichtigste Teil für eine starke Versorgungsplanung.',
      fields: [
        textareaField('improvementGoal', 'Was soll sich konkret verbessern?', { required: true, wide: true }),
        textareaField('mostUrgentGoal', 'Was ist am dringendsten?', { required: true, wide: true }),
        textareaField('goalTwoWeeks', 'Was soll in den nächsten 2 Wochen erreicht werden?', { wide: true }),
        textareaField('goalThreeMonths', 'Was soll in den nächsten 3 Monaten erreicht werden?', { wide: true }),
        checkboxField('goalFocus', 'Worum geht es vor allem?', ['Entlastung der Angehörigen', 'Pflegegrad', 'Sichere Versorgung zuhause', 'Mehr Selbstständigkeit', 'Weniger Überforderung', 'Bessere Struktur', 'Hilfsmittel', 'Reha', 'Behörden oder Unterlagen'], { wide: true }),
        textareaField('familyGoal', 'Was wäre für die Familie ein gutes Ergebnis?', { required: true, wide: true }),
      ],
    },
    {
      title: 'Dokumente',
      intro: 'Hier können Sie relevante Unterlagen direkt hinzufügen. Diese werden nach erfolgreicher Zahlung mitgesendet.',
      fields: [
        {
          id: 'supportingDocuments',
          label: 'Dokumente hochladen',
          type: 'file',
          wide: true,
          help: 'Empfohlen: Pflegegradbescheid, MD-Gutachten, Arztberichte, Entlassungsberichte, Medikamentenplan, Hilfsmittelübersicht, relevante Anträge oder Ablehnungen, Vollmacht oder Betreuerausweis.',
        },
      ],
    },
  ];

  const FIELD_MAP = new Map();
  SECTIONS.forEach((section) => {
    section.fields.forEach((field) => FIELD_MAP.set(field.id, field));
  });

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadJson(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(FILE_STORE)) {
          const store = db.createObjectStore(FILE_STORE, { keyPath: 'id' });
          store.createIndex('byOrderRef', 'orderRef', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getFilesForKey(orderRef) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, 'readonly');
      const store = tx.objectStore(FILE_STORE).index('byOrderRef');
      const request = store.getAll(orderRef);
      request.onsuccess = () => {
        const records = Array.isArray(request.result) ? request.result : [];
        resolve(records.map((item) => item.file).filter(Boolean));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async function clearFilesForKey(orderRef) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, 'readwrite');
      const index = tx.objectStore(FILE_STORE).index('byOrderRef');
      const request = index.getAll(orderRef);
      request.onsuccess = () => {
        const store = tx.objectStore(FILE_STORE);
        request.result.forEach((record) => store.delete(record.id));
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function saveFilesForKey(orderRef, files) {
    await clearFilesForKey(orderRef);
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, 'readwrite');
      const store = tx.objectStore(FILE_STORE);
      files.forEach((file, index) => {
        store.put({
          id: `${orderRef}-${index}-${file.name}`,
          orderRef,
          file,
        });
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function getOrders() {
    return loadJson(ORDER_STORAGE_KEY, {});
  }

  function saveOrders(orders) {
    saveJson(ORDER_STORAGE_KEY, orders);
  }

  function getDispatchedOrders() {
    return loadJson(DISPATCHED_STORAGE_KEY, {});
  }

  function saveDispatchedOrders(value) {
    saveJson(DISPATCHED_STORAGE_KEY, value);
  }

  function buildSubmissionFromDraft(draft, files) {
    return {
      ...draft,
      uploadedFiles: files.map((file) => `${file.name} (${Math.round(file.size / 1024)} KB)`),
    };
  }

  function formatValue(field, value) {
    if (Array.isArray(value)) return value.join(', ');
    if (field?.type === 'date' && value) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString('de-DE');
      }
    }
    return String(value || '').trim();
  }

  function getRequiredMissingForSection(section, draft, files) {
    return section.fields.filter((field) => {
      if (!field.required) return false;
      if (field.type === 'file') return files.length === 0;
      const value = draft[field.id];
      return Array.isArray(value) ? value.length === 0 : !String(value || '').trim();
    });
  }

  function renderField(field, draft, files) {
    const value = draft[field.id];
    const fieldClass = field.wide ? 'planning-field planning-field-wide' : 'planning-field';

    if (field.type === 'radio') {
      return `
        <div class="${fieldClass}">
          <label class="planning-label">${escapeHtml(field.label)}${field.required ? ' <span>*</span>' : ''}</label>
          <div class="planning-choice-grid" data-field="${escapeHtml(field.id)}">
            ${field.options.map((option) => `
              <label class="planning-choice-card${value === option ? ' is-selected' : ''}">
                <input type="radio" name="${escapeHtml(field.id)}" value="${escapeHtml(option)}" ${value === option ? 'checked' : ''}>
                <span>${escapeHtml(option)}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (field.type === 'checkbox') {
      const checkedValues = Array.isArray(value) ? value : [];
      return `
        <div class="${fieldClass}">
          <label class="planning-label">${escapeHtml(field.label)}</label>
          <div class="planning-chip-grid">
            ${field.options.map((option) => `
              <label class="planning-chip${checkedValues.includes(option) ? ' is-selected' : ''}">
                <input type="checkbox" name="${escapeHtml(field.id)}" value="${escapeHtml(option)}" ${checkedValues.includes(option) ? 'checked' : ''}>
                <span>${escapeHtml(option)}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (field.type === 'select') {
      return `
        <div class="${fieldClass}">
          <label class="planning-label" for="${escapeHtml(field.id)}">${escapeHtml(field.label)}${field.required ? ' <span>*</span>' : ''}</label>
          <select id="${escapeHtml(field.id)}" name="${escapeHtml(field.id)}">
            <option value="">Bitte auswählen</option>
            ${field.options.map((option) => `<option value="${escapeHtml(option)}" ${value === option ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}
          </select>
        </div>
      `;
    }

    if (field.type === 'textarea') {
      return `
        <div class="${fieldClass}">
          <label class="planning-label" for="${escapeHtml(field.id)}">${escapeHtml(field.label)}${field.required ? ' <span>*</span>' : ''}</label>
          <textarea id="${escapeHtml(field.id)}" name="${escapeHtml(field.id)}" rows="${field.rows || 4}" placeholder="${escapeHtml(field.placeholder || '')}">${escapeHtml(value || '')}</textarea>
        </div>
      `;
    }

    if (field.type === 'file') {
      return `
        <div class="${fieldClass}">
          <label class="planning-label" for="${escapeHtml(field.id)}">${escapeHtml(field.label)}</label>
          <div class="planning-upload-box">
            <input id="${escapeHtml(field.id)}" type="file" name="${escapeHtml(field.id)}" data-planning-files multiple accept="application/pdf,image/*,.doc,.docx">
            <p>${escapeHtml(field.help || '')}</p>
            <ul class="planning-file-list">
              ${files.length ? files.map((file) => `<li>${escapeHtml(file.name)} <span>${Math.round(file.size / 1024)} KB</span></li>`).join('') : '<li>Noch keine Dokumente ausgewählt</li>'}
            </ul>
          </div>
        </div>
      `;
    }

    const inputType = field.type || 'text';
    return `
      <div class="${fieldClass}">
        <label class="planning-label" for="${escapeHtml(field.id)}">${escapeHtml(field.label)}${field.required ? ' <span>*</span>' : ''}</label>
        <input id="${escapeHtml(field.id)}" type="${escapeHtml(inputType)}" name="${escapeHtml(field.id)}" value="${escapeHtml(value || '')}" placeholder="${escapeHtml(field.placeholder || '')}">
      </div>
    `;
  }

  function renderReview(state) {
    const draft = state.draft;
    const reviewGroups = [
      ['Person', `${draft.firstName || ''} ${draft.lastName || ''}`.trim(), draft.email || '', draft.phone || ''],
      ['Hauptproblem', draft.mainProblem || '', draft.dailyLimitations || '', draft.currentGaps || ''],
      ['Versorgung', draft.currentHelpers || '', draft.availableDocuments || '', draft.familyGoal || ''],
    ];

    const validation = state.validationResult;
    return `
      <div class="planning-review-grid">
        ${reviewGroups.map(([title, ...items]) => `
          <article class="planning-review-card">
            <h3>${escapeHtml(title)}</h3>
            <ul>
              ${items.filter(Boolean).map((item) => `<li>${escapeHtml(item)}</li>`).join('') || '<li>Noch keine Angaben</li>'}
            </ul>
          </article>
        `).join('')}
      </div>
      <div class="planning-validation-card${validation ? (validation.ready ? ' is-ready' : ' is-warning') : ''}">
        <div>
          <h3>Prüfung vor der Zahlung</h3>
          <p>${validation ? (validation.ready ? 'Die Pflichtangaben sind vollständig genug, um zur Zahlung zu gehen.' : 'Es fehlen noch Angaben oder Rückfragen für einen belastbaren Versorgungsplan.') : 'Starten Sie jetzt die Prüfung. Erst bei ausreichender Vollständigkeit wird die Zahlung freigeschaltet.'}</p>
        </div>
        ${validation?.summary ? `<p class="planning-validation-summary">${escapeHtml(validation.summary)}</p>` : ''}
        ${validation?.missingFields?.length ? `<div class="planning-validation-list"><strong>Fehlt noch:</strong><ul>${validation.missingFields.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
        ${validation?.followUpQuestions?.length ? `<div class="planning-validation-list"><strong>Nachfragen:</strong><ul>${validation.followUpQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
        ${validation?.warnings?.length ? `<div class="planning-validation-list"><strong>Hinweise:</strong><ul>${validation.warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
        ${validation?.reviewError ? `<p class="planning-inline-note">Die GPT-Prüfung war gerade nicht erreichbar. Die lokale Pflichtfeldprüfung wurde trotzdem ausgeführt.</p>` : ''}
      </div>
      <div class="planning-payment-box">
        <div>
          <span class="planning-payment-price">0 €</span>
          <p>Die Zahlung startet erst, wenn die Prüfung keine kritischen Lücken mehr meldet.</p>
        </div>
        <div class="planning-payment-actions">
          <button class="btn ghost" type="button" data-action="validate">Mit KI prüfen</button>
          <button class="btn primary" type="button" data-action="checkout" ${validation?.ready ? '' : 'disabled'}>Zur Zahlung mit Mollie</button>
        </div>
      </div>
    `;
  }

  function renderApp(root, state) {
    const isReview = state.currentStep === SECTIONS.length;
    const section = isReview ? null : SECTIONS[state.currentStep];
    const currentMissing = section ? getRequiredMissingForSection(section, state.draft, state.draftFiles) : [];

    root.innerHTML = `
      <div class="planning-shell">
        <aside class="planning-sidebar">
          <div class="planning-sidebar-head">
            <span class="planning-eyebrow">Versorgungsplanung</span>
            <h3>Ihr Fortschritt</h3>
            <p>Alle Eingaben bleiben in diesem Browser gespeichert, bis der Vorgang abgeschlossen ist.</p>
          </div>
          <ol class="planning-step-list">
            ${SECTIONS.map((item, index) => {
              const complete = getRequiredMissingForSection(item, state.draft, state.draftFiles).length === 0;
              const active = index === state.currentStep;
              return `
                <li>
                  <button type="button" class="planning-step${active ? ' is-active' : ''}${complete ? ' is-complete' : ''}" data-goto-step="${index}">
                    <span class="planning-step-index">${index + 1}</span>
                    <span>
                      <strong>${escapeHtml(item.title)}</strong>
                      <small>${escapeHtml(item.intro)}</small>
                    </span>
                  </button>
                </li>
              `;
            }).join('')}
            <li>
              <button type="button" class="planning-step${isReview ? ' is-active' : ''}${state.validationResult?.ready ? ' is-complete' : ''}" data-goto-step="${SECTIONS.length}">
                <span class="planning-step-index"><i class="fa-solid fa-check"></i></span>
                <span>
                  <strong>Prüfung & Zahlung</strong>
                  <small>Vollständigkeit prüfen und erst dann bezahlen.</small>
                </span>
              </button>
            </li>
          </ol>
        </aside>
        <div class="planning-main-card">
          <div class="planning-main-head">
            <div>
              <span class="planning-eyebrow">Schritt ${isReview ? 'Final' : state.currentStep + 1}</span>
              <h2>${escapeHtml(isReview ? 'Prüfung und Zahlungsfreigabe' : section.title)}</h2>
              <p>${escapeHtml(isReview ? 'Prüfen Sie jetzt die Gesamtlage. Danach wird die Zahlung für die Versorgungsplanung freigegeben.' : section.intro)}</p>
            </div>
            <div class="planning-progress-meter">
              <strong>${Math.round(((state.currentStep + 1) / (SECTIONS.length + 1)) * 100)}%</strong>
              <span>Fortschritt</span>
            </div>
          </div>
          ${!isReview && currentMissing.length ? `<div class="planning-inline-warning"><i class="fa-solid fa-circle-exclamation"></i> In diesem Schritt fehlen noch ${currentMissing.length} Pflichtangaben.</div>` : ''}
          <div class="planning-stage-body">
            ${isReview ? renderReview(state) : `<div class="planning-form-grid">${section.fields.map((field) => renderField(field, state.draft, state.draftFiles)).join('')}</div>`}
          </div>
          <div class="planning-footer-actions">
            <button class="btn ghost" type="button" data-action="prev" ${state.currentStep === 0 ? 'disabled' : ''}><i class="fa-solid fa-arrow-left"></i> Zurück</button>
            ${isReview
              ? '<button class="btn ghost" type="button" data-action="goto-form"><i class="fa-solid fa-pen-to-square"></i> Angaben weiter bearbeiten</button>'
              : `<button class="btn primary" type="button" data-action="next">${state.currentStep === SECTIONS.length - 1 ? 'Zur Prüfung' : 'Weiter'}</button>`}
          </div>
        </div>
      </div>
    `;
  }

  function collectSectionValues(root, section, draft) {
    const nextDraft = { ...draft };
    section.fields.forEach((field) => {
      if (field.type === 'file') return;
      if (field.type === 'checkbox') {
        nextDraft[field.id] = Array.from(root.querySelectorAll(`input[name="${field.id}"]:checked`)).map((input) => input.value);
        return;
      }
      if (field.type === 'radio') {
        nextDraft[field.id] = root.querySelector(`input[name="${field.id}"]:checked`)?.value || '';
        return;
      }
      nextDraft[field.id] = root.querySelector(`[name="${field.id}"]`)?.value?.trim() || '';
    });
    return nextDraft;
  }

  function resetValidation(state) {
    state.validationResult = null;
  }

  async function handleFileSelection(input, state, rerender) {
    const incomingFiles = Array.from(input.files || []);
    if (incomingFiles.length > MAX_UPLOAD_COUNT) {
      alert(`Bitte maximal ${MAX_UPLOAD_COUNT} Dateien hochladen.`);
      input.value = '';
      return;
    }

    if (incomingFiles.some((file) => file.size > MAX_UPLOAD_SIZE)) {
      alert('Bitte nur Dateien bis maximal 5 MB pro Dokument hochladen.');
      input.value = '';
      return;
    }

    state.draftFiles = incomingFiles;
    await saveFilesForKey('draft', incomingFiles);
    resetValidation(state);
    rerender();
  }

  async function validatePlanning(state, rerender) {
    const submission = buildSubmissionFromDraft(state.draft, state.draftFiles);
    const button = document.querySelector('[data-action="validate"]');
    if (button) {
      button.disabled = true;
      button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Prüfung läuft';
    }

    try {
      const response = await fetch('/api/planning/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ submission }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Prüfung konnte nicht durchgeführt werden');
      }

      state.validationResult = data;
      rerender();
    } catch (error) {
      alert('Die Prüfung konnte gerade nicht gestartet werden. Bitte versuchen Sie es erneut.');
    } finally {
      if (button) {
        button.disabled = false;
        button.innerHTML = 'Mit KI prüfen';
      }
    }
  }

  async function startCheckout(state) {
    if (!state.validationResult?.ready) {
      alert('Bitte prüfen Sie das Formular zuerst vollständig.');
      return;
    }

    const applicantName = `${state.draft.firstName || ''} ${state.draft.lastName || ''}`.trim();
    if (!applicantName || !state.draft.email) {
      alert('Bitte ergänzen Sie Vorname, Nachname und E-Mail-Adresse.');
      return;
    }

    const checkoutButton = document.querySelector('[data-action="checkout"]');
    if (checkoutButton) {
      checkoutButton.disabled = true;
      checkoutButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Weiterleitung';
    }

    try {
      const response = await fetch('/api/planning/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicantName,
          customerEmail: state.draft.email,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.checkoutUrl || !data?.orderRef) {
        throw new Error(data?.message || 'Checkout konnte nicht erstellt werden');
      }

      const orders = getOrders();
      orders[data.orderRef] = {
        createdAt: new Date().toISOString(),
        draft: state.draft,
        validationResult: state.validationResult,
      };
      saveOrders(orders);
      await saveFilesForKey(data.orderRef, state.draftFiles);

      window.location.href = data.checkoutUrl;
    } catch (error) {
      alert('Der Bezahlvorgang konnte gerade nicht gestartet werden. Bitte versuchen Sie es erneut.');
      if (checkoutButton) {
        checkoutButton.disabled = false;
        checkoutButton.innerHTML = 'Zur Zahlung mit Mollie';
      }
    }
  }

  async function initPlanningApp(root) {
    const state = {
      currentStep: 0,
      draft: loadJson(DRAFT_STORAGE_KEY, {}),
      validationResult: null,
      draftFiles: [],
    };

    try {
      state.draftFiles = await getFilesForKey('draft');
    } catch {
      state.draftFiles = [];
    }

    const rerender = () => renderApp(root, state);
    rerender();

    root.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-action], [data-goto-step]');
      if (!button) return;

      if (button.hasAttribute('data-goto-step')) {
        if (state.currentStep < SECTIONS.length) {
          state.draft = collectSectionValues(root, SECTIONS[state.currentStep], state.draft);
          saveJson(DRAFT_STORAGE_KEY, state.draft);
        }
        state.currentStep = Number(button.getAttribute('data-goto-step'));
        rerender();
        return;
      }

      const action = button.getAttribute('data-action');
      if (state.currentStep < SECTIONS.length) {
        state.draft = collectSectionValues(root, SECTIONS[state.currentStep], state.draft);
        saveJson(DRAFT_STORAGE_KEY, state.draft);
      }

      if (action === 'prev' && state.currentStep > 0) {
        state.currentStep -= 1;
        rerender();
      }

      if (action === 'next') {
        state.currentStep = Math.min(SECTIONS.length, state.currentStep + 1);
        rerender();
      }

      if (action === 'goto-form') {
        state.currentStep = SECTIONS.length - 1;
        rerender();
      }

      if (action === 'validate') {
        await validatePlanning(state, rerender);
      }

      if (action === 'checkout') {
        await startCheckout(state);
      }
    });

    root.addEventListener('change', async (event) => {
      const target = event.target;
      if (target.matches('[data-planning-files]')) {
        await handleFileSelection(target, state, rerender);
        return;
      }

      if (state.currentStep < SECTIONS.length) {
        state.draft = collectSectionValues(root, SECTIONS[state.currentStep], state.draft);
        saveJson(DRAFT_STORAGE_KEY, state.draft);
        resetValidation(state);
        if (target.matches('input[type="radio"], input[type="checkbox"], select')) {
          rerender();
        }
      }
    });

    root.addEventListener('input', () => {
      if (state.currentStep < SECTIONS.length) {
        state.draft = collectSectionValues(root, SECTIONS[state.currentStep], state.draft);
        saveJson(DRAFT_STORAGE_KEY, state.draft);
        resetValidation(state);
      }
    });
  }

  function buildPdfSections(order) {
    return SECTIONS.map((section) => {
      const entries = section.fields
        .filter((field) => field.type !== 'file')
        .map((field) => ({
          label: field.label,
          value: formatValue(field, order.draft[field.id]),
        }))
        .filter((entry) => entry.value);

      if (section.title === 'Dokumente') {
        const fileEntries = (order.files || []).map((file) => ({
          label: 'Hochgeladene Datei',
          value: `${file.name} (${Math.round(file.size / 1024)} KB)`,
        }));
        return { title: section.title, entries: fileEntries };
      }

      return { title: section.title, entries };
    }).filter((section) => section.entries.length > 0);
  }

  function createPdfBlob(orderRef, order, paymentStatus) {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) {
      throw new Error('PDF library not loaded');
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    let y = margin;

    function addWrappedText(text, fontSize, isBold) {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
      if (y + lines.length * (fontSize + 4) > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(lines, margin, y);
      y += lines.length * (fontSize + 4) + 8;
    }

    addWrappedText('Versorgungsplanung - Eingangsunterlagen', 20, true);
    addWrappedText(`Bestellreferenz: ${orderRef}`, 11, false);
    addWrappedText(`Zahlungsstatus: ${paymentStatus.status}`, 11, false);
    addWrappedText(`Bezahlt am: ${new Date().toLocaleString('de-DE')}`, 11, false);

    if (order.validationResult?.summary) {
      addWrappedText('Kurzfassung der KI-Prüfung', 14, true);
      addWrappedText(order.validationResult.summary, 11, false);
    }

    buildPdfSections(order).forEach((section) => {
      addWrappedText(section.title, 15, true);
      section.entries.forEach((entry) => {
        addWrappedText(`${entry.label}: ${entry.value}`, 11, false);
      });
    });

    return doc.output('blob');
  }

  function buildEmailMessage(orderRef, order, paymentStatus) {
    const applicantName = `${order.draft.firstName || ''} ${order.draft.lastName || ''}`.trim();
    const lines = [
      'Neue bezahlte Versorgungsplanung',
      '',
      `Bestellreferenz: ${orderRef}`,
      `Name: ${applicantName}`,
      `E-Mail: ${order.draft.email || paymentStatus.customerEmail || ''}`,
      `Telefon: ${order.draft.phone || ''}`,
      `Zahlungsstatus: ${paymentStatus.status}`,
      '',
      'Kernaussagen:',
      `Grund der Anfrage: ${order.draft.requestReason || ''}`,
      `Hauptproblem: ${order.draft.mainProblem || ''}`,
      `Versorgungslücken: ${order.draft.currentGaps || ''}`,
      `Ziel der Familie: ${order.draft.familyGoal || ''}`,
      '',
      `Hochgeladene Dokumente: ${(order.files || []).map((file) => file.name).join(', ') || 'keine zusätzlichen Dokumente'}`,
    ];

    return lines.join('\n');
  }

  async function sendOrderToWeb3Forms(orderRef, order, paymentStatus) {
    const pdfBlob = createPdfBlob(orderRef, order, paymentStatus);
    const formData = new FormData();
    const applicantName = `${order.draft.firstName || ''} ${order.draft.lastName || ''}`.trim() || paymentStatus.applicantName || 'Versorgungsplanung';

    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', `Bezahlte Versorgungsplanung | ${applicantName} | ${orderRef}`);
    formData.append('from_name', 'casekompass.de Versorgungsplanung');
    formData.append('name', applicantName);
    formData.append('email', order.draft.email || paymentStatus.customerEmail || 'casekompass@gmx.de');
    formData.append('message', buildEmailMessage(orderRef, order, paymentStatus));
    formData.append('botcheck', '');
    formData.append('attachment', pdfBlob, `versorgungsplanung-${orderRef}.pdf`);

    (order.files || []).slice(0, MAX_UPLOAD_COUNT).forEach((file, index) => {
      formData.append(`attachment_${index + 1}`, file, file.name);
    });

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || 'Web3Forms submission failed');
    }
  }

  async function loadPlanningPaymentStatus(token) {
    const response = await fetch('/api/planning/payment-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || 'Zahlungsstatus konnte nicht geladen werden');
    }

    return data;
  }

  async function initPlanningStatus(root) {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || '';

    if (!token) {
      root.classList.add('is-warning');
      root.innerHTML = `
        <div class="shop-status-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
        <h2>Kein gültiger Freigabe-Link</h2>
        <p>Für diesen Vorgang fehlt der Token. Bitte starten Sie die Versorgungsplanung erneut auf der Detailseite.</p>
        <div class="shop-status-actions">
          <a class="btn primary" href="versorgungsplanung.html"><i class="fa-solid fa-arrow-left"></i> Zur Versorgungsplanung</a>
          <a class="btn ghost" href="kontakt.html"><i class="fa-regular fa-envelope"></i> Kontakt</a>
        </div>
      `;
      return;
    }

    try {
      const paymentStatus = await loadPlanningPaymentStatus(token);

      if (!paymentStatus.isPaid) {
        root.classList.add('is-warning');
        root.innerHTML = `
          <div class="shop-status-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
          <h2>Zahlung noch nicht abgeschlossen</h2>
          <p>Der aktuelle Status ist <strong>${escapeHtml(paymentStatus.status)}</strong>. Sobald die Zahlung bestätigt ist, wird die PDF-Zusammenfassung automatisch verschickt.</p>
          <div class="shop-status-actions">
            <a class="btn primary" href="versorgungsplanung.html"><i class="fa-solid fa-rotate-right"></i> Zurück zur Versorgungsplanung</a>
            <a class="btn ghost" href="kontakt.html"><i class="fa-regular fa-envelope"></i> Kontakt</a>
          </div>
        `;
        return;
      }

      const orders = getOrders();
      const order = orders[paymentStatus.orderRef] || null;
      const dispatched = getDispatchedOrders();

      if (dispatched[paymentStatus.orderRef]) {
        root.classList.add('is-success');
        root.innerHTML = `
          <div class="shop-status-icon"><i class="fa-solid fa-circle-check"></i></div>
          <h2>Zahlung erfolgreich verarbeitet</h2>
          <p>Die Versorgungsplanung wurde bereits an casekompass.de übermittelt. Sie müssen nichts weiter tun.</p>
          <div class="shop-status-actions">
            <a class="btn ghost" href="versorgungsplanung.html"><i class="fa-solid fa-arrow-left"></i> Zurück zur Versorgungsplanung</a>
          </div>
        `;
        return;
      }

      if (!order) {
        root.classList.add('is-warning');
        root.innerHTML = `
          <div class="shop-status-icon"><i class="fa-solid fa-circle-info"></i></div>
          <h2>Zahlung erkannt, Daten fehlen lokal</h2>
          <p>Die Zahlung ist bestätigt, aber die Formulardaten sind in diesem Browser nicht mehr vorhanden. Bitte melden Sie sich kurz, damit der Vorgang manuell abgeschlossen werden kann.</p>
          <div class="shop-status-actions">
            <a class="btn primary" href="kontakt.html"><i class="fa-regular fa-envelope"></i> Kontakt aufnehmen</a>
            <a class="btn ghost" href="versorgungsplanung.html"><i class="fa-solid fa-arrow-left"></i> Zurück</a>
          </div>
        `;
        return;
      }

      order.files = await getFilesForKey(paymentStatus.orderRef);
      await sendOrderToWeb3Forms(paymentStatus.orderRef, order, paymentStatus);

      dispatched[paymentStatus.orderRef] = {
        sentAt: new Date().toISOString(),
      };
      saveDispatchedOrders(dispatched);
      saveJson(DRAFT_STORAGE_KEY, {});
      await clearFilesForKey('draft');

      root.classList.add('is-success');
      root.innerHTML = `
        <div class="shop-status-icon"><i class="fa-solid fa-paper-plane"></i></div>
        <h2>Versorgungsplanung erfolgreich übermittelt</h2>
        <p>Die Zahlung wurde bestätigt. Ihre PDF-Zusammenfassung und die ausgewählten Unterlagen wurden soeben an casekompass.de gesendet.</p>
        <div class="shop-status-actions">
          <a class="btn ghost" href="versorgungsplanung.html"><i class="fa-solid fa-arrow-left"></i> Zurück zur Versorgungsplanung</a>
          <a class="btn ghost" href="kontakt.html"><i class="fa-regular fa-envelope"></i> Kontakt</a>
        </div>
      `;
    } catch (error) {
      root.classList.add('is-warning');
      root.innerHTML = `
        <div class="shop-status-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
        <h2>Abschluss konnte nicht automatisch gesendet werden</h2>
        <p>Die Zahlung wurde zwar geprüft, aber der Versand an casekompass.de ist gerade fehlgeschlagen. Bitte versuchen Sie die Seite erneut oder melden Sie sich direkt.</p>
        <div class="shop-status-actions">
          <a class="btn primary" href="versorgungsplanung.html"><i class="fa-solid fa-arrow-left"></i> Zurück zur Versorgungsplanung</a>
          <a class="btn ghost" href="kontakt.html"><i class="fa-regular fa-envelope"></i> Kontakt</a>
        </div>
      `;
    }
  }

  const appRoot = document.querySelector('[data-planning-app]');
  const statusRoot = document.querySelector('[data-planning-status]');

  if (appRoot) {
    initPlanningApp(appRoot);
  }

  if (statusRoot) {
    initPlanningStatus(statusRoot);
  }
})();