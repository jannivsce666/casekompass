(function () {
  if (typeof window === 'undefined' || window.location.protocol === 'file:') return;

  const WEB3FORMS_ACCESS_KEY = '0697e1bf-0224-41c9-b952-bf80dea963ef';
  const DRAFT_STORAGE_KEY = 'casekompass-pflegegrad-draft-v1';
  const ORDER_STORAGE_KEY = 'casekompass-pflegegrad-orders-v1';
  const DISPATCHED_STORAGE_KEY = 'casekompass-pflegegrad-dispatched-v1';
  const DEFAULT_FIELD_HELP = 'Tragen Sie hier die Angabe so ein, wie sie für die aktuelle Pflegesituation am besten passt.';
  const PACKAGE_PRICE_LABEL = '99,50 Euro';

  function textField(id, label, options) {
    return { id, label, type: 'text', ...options };
  }

  function textareaField(id, label, options) {
    return { id, label, type: 'textarea', rows: 4, ...options };
  }

  function selectField(id, label, options, extra) {
    return { id, label, type: 'select', options, ...extra };
  }

  function radioField(id, label, options, extra) {
    return { id, label, type: 'radio', options, required: true, ...extra };
  }

  function yesNoField(id, label, extra) {
    return { id, label, type: 'radio', options: ['Ja', 'Nein'], required: true, ...extra };
  }

  function checkboxField(id, label, options, extra) {
    return { id, label, type: 'checkbox', options, ...extra };
  }

  const SECTIONS = [
    {
      title: 'Kontaktdaten',
      intro: 'Zuerst die Daten der anfragenden Person, damit ich den Fall richtig zuordnen und mich nach der Zahlung direkt melden kann.',
      fields: [
        textField('requesterFirstName', 'Vorname der anfragenden Person', { required: true }),
        textField('requesterLastName', 'Nachname der anfragenden Person', { required: true }),
        selectField('relationshipToPerson', 'Verhältnis zur betroffenen Person', ['Betroffene Person selbst', 'Tochter oder Sohn', 'Partner oder Partnerin', 'Enkelkind', 'Bevollmächtigte Person', 'Gesetzliche Betreuung', 'Andere Bezugsperson'], { required: true, wide: true }),
        { id: 'requesterPhone', label: 'Telefonnummer', type: 'tel', required: true, placeholder: '0152...' },
        { id: 'requesterEmail', label: 'E-Mail-Adresse', type: 'email', required: true, placeholder: 'name@beispiel.de' },
      ],
    },
    {
      title: 'Betroffene Person',
      intro: 'Nun die wichtigsten Basisangaben zur betroffenen Person und zum aktuellen Wohnumfeld.',
      fields: [
        textField('personFirstName', 'Vorname der betroffenen Person', { required: true }),
        textField('personLastName', 'Nachname der betroffenen Person', { required: true }),
        textField('personAge', 'Alter der betroffenen Person', { required: true, placeholder: 'z. B. 78 Jahre' }),
        textField('personCity', 'Wohnort', { required: true, wide: true }),
        selectField('livingArrangement', 'Wie lebt die Person aktuell?', ['Allein', 'Mit Angehörigen', 'Mit Partner oder Partnerin', 'Betreutes Wohnen', 'Pflegeeinrichtung', 'Andere Wohnform'], { required: true, wide: true }),
      ],
    },
    {
      title: 'Aktuelle Pflegesituation',
      intro: 'Hier geht es um den Stand beim Pflegegrad, den Antrag und die Vorbereitung auf die Begutachtung.',
      fields: [
        yesNoField('hasCareLevel', 'Besteht bereits ein Pflegegrad?'),
        textField('careLevelValue', 'Wenn ja, welcher Pflegegrad?', { required: true, showWhen: (draft) => draft.hasCareLevel === 'Ja' }),
        radioField('careRequestType', 'Handelt es sich um einen Erstantrag oder um eine Höherstufung?', ['Erstantrag', 'Höherstufung']),
        yesNoField('applicationAlreadySubmitted', 'Wurde bereits ein Antrag gestellt?'),
        yesNoField('assessmentAppointmentSet', 'Gibt es schon einen Termin zur Begutachtung?'),
        textareaField('assessmentAppointmentDetails', 'Wenn ja, was ist zum Termin bereits bekannt?', { rows: 3, wide: true, showWhen: (draft) => draft.assessmentAppointmentSet === 'Ja' }),
        textField('insuranceProvider', 'Bei welcher Pflegekasse ist die Person versichert?', { required: true, wide: true }),
      ],
    },
    {
      title: 'Unterstützungsbedarf im Alltag',
      intro: 'Welche Unterstützung wird aktuell benötigt und wo zeigt sich der Hilfebedarf im Alltag am deutlichsten?',
      fields: [
        checkboxField('supportNeeds', 'Wobei braucht die Person aktuell Unterstützung?', ['Körperpflege', 'Anziehen', 'Essen und Trinken', 'Toilettengang', 'Mobilität', 'Medikamente', 'Haushalt', 'Organisation des Alltags'], { required: true, wide: true }),
        textareaField('difficultActivities', 'Welche Tätigkeiten fallen besonders schwer?', { required: true, wide: true, placeholder: 'Zum Beispiel Aufstehen, Treppen, Duschen, Anziehen oder Organisation im Alltag.' }),
        textareaField('basicCareProblems', 'Gibt es Probleme mit Körperpflege, Anziehen, Essen, Toilettengang oder Mobilität?', { required: true, wide: true, placeholder: 'Bitte kurz beschreiben, was ohne Hilfe nicht oder nur schwer möglich ist.' }),
        yesNoField('cognitiveOrPsychologicalIssues', 'Gibt es Gedächtnisprobleme, Orientierungsschwierigkeiten oder psychische Belastungen?'),
        textareaField('cognitiveOrPsychologicalDetails', 'Wenn ja, welche Auffälligkeiten fallen besonders auf?', { rows: 4, wide: true, showWhen: (draft) => draft.cognitiveOrPsychologicalIssues === 'Ja' }),
        yesNoField('nightSupportNeeded', 'Besteht nächtlicher Hilfebedarf?'),
        textareaField('currentDailySupport', 'Wer unterstützt aktuell im Alltag?', { required: true, wide: true, placeholder: 'Zum Beispiel Angehörige, Nachbarn, Pflegedienst oder noch niemand regelmäßig.' }),
      ],
    },
    {
      title: 'Gesundheitliche Situation',
      intro: 'Die gesundheitliche Lage ist wichtig, damit das Pflegegrad-Startpaket die tatsächliche Belastung im Alltag richtig abbildet.',
      fields: [
        textareaField('diagnosesAndLimitations', 'Welche wichtigen Diagnosen oder gesundheitlichen Einschränkungen bestehen?', { required: true, wide: true, rows: 5, placeholder: 'Zum Beispiel Schlaganfall, Demenz, Parkinson, starke Schmerzen, Erschöpfung oder Unsicherheit beim Gehen.' }),
        checkboxField('availableAids', 'Gibt es Hilfsmittel wie Rollator, Rollstuhl oder Pflegebett?', ['Rollator', 'Rollstuhl', 'Pflegebett', 'Gehstock', 'Duschstuhl', 'Hausnotruf', 'Keine Hilfsmittel', 'Andere Hilfsmittel'], { required: true, wide: true }),
        yesNoField('recentDeclineOrHospital', 'Gab es in letzter Zeit eine deutliche Verschlechterung oder einen Krankenhausaufenthalt?'),
        textareaField('recentDeclineOrHospitalDetails', 'Wenn ja, was ist passiert und welche Folgen hat das aktuell?', { rows: 4, wide: true, showWhen: (draft) => draft.recentDeclineOrHospital === 'Ja' }),
      ],
    },
    {
      title: 'Ziel des Pakets',
      intro: 'Zum Schluss geht es um Ihr Zielbild, offene Fragen und darum, worauf ich im Paket besonders achten soll.',
      fields: [
        textareaField('desiredSupport', 'Wobei wünschen Sie sich konkret Unterstützung?', { required: true, wide: true, rows: 5, placeholder: 'Zum Beispiel Antrag gemeinsam vorbereiten, Unterlagen sortieren oder Begutachtung besser verstehen.' }),
        textareaField('specialConsiderations', 'Was soll ich für Ihr Pflegegrad-Startpaket besonders berücksichtigen?', { required: true, wide: true, rows: 4, placeholder: 'Zum Beispiel Zeitdruck, schwierige Familiensituation, bereits laufender Termin oder besondere Belastungen.' }),
        textareaField('currentQuestions', 'Welche Fragen oder Unsicherheiten haben Sie aktuell?', { required: true, wide: true, rows: 5, placeholder: 'Welche Punkte sind gerade unklar oder machen Ihnen am meisten Sorgen?' }),
      ],
    },
  ];

  const FIELD_HELP_TEXTS = {
    relationshipToPerson: 'Damit später klar ist, aus welcher Perspektive die Angaben gemacht werden.',
    requesterPhone: 'Bitte eine Nummer angeben, unter der Rückfragen zum Pflegegrad-Fall gut möglich sind.',
    requesterEmail: 'An diese Adresse geht die Bestellbestätigung und die weitere Rückmeldekommunikation.',
    personAge: 'Eine ungefähre Angabe reicht. Es geht nicht um das genaue Geburtsdatum.',
    careRequestType: 'Bitte wählen Sie den Fall, der aktuell am ehesten passt.',
    assessmentAppointmentDetails: 'Zum Beispiel Datum, Hausbesuch, offene Fragen oder bereits bekannte Hinweise.',
    supportNeeds: 'Mehrfachauswahl ist möglich.',
    difficultActivities: 'Beschreiben Sie möglichst konkrete Situationen statt nur allgemeine Begriffe wie Pflege oder Hilfe.',
    basicCareProblems: 'Entscheidend ist, was im Alltag praktisch nicht mehr allein klappt.',
    currentDailySupport: 'Hier reicht eine kurze Übersicht, wer aktuell wie ungefähr eingebunden ist.',
    availableAids: 'Wählen Sie alles aus, was aktuell schon vorhanden oder genutzt wird.',
    diagnosesAndLimitations: 'Es geht nicht um medizinische Vollständigkeit, sondern um die Themen, die den Alltag wirklich prägen.',
    desiredSupport: 'Beschreiben Sie möglichst konkret, wobei Sie im Paket Hilfe erwarten.',
    specialConsiderations: 'Hier können Sie alles ergänzen, was im Ablauf besonders beachtet werden sollte.',
    currentQuestions: 'Je konkreter Ihre Fragen sind, desto gezielter kann ich das Paket vorbereiten.',
  };

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

  function isLikelyPhoneNumber(value) {
    const normalized = String(value || '').replace(/[^\d+]/g, '');
    return normalized.length >= 7;
  }

  function isLikelyAge(value) {
    const normalized = Number.parseInt(String(value || '').replace(/[^\d]/g, ''), 10);
    return Number.isInteger(normalized) && normalized >= 0 && normalized <= 120;
  }

  function validateCheckoutDraft(draft) {
    if (!isValidEmail(draft.requesterEmail)) {
      return 'Bitte geben Sie eine gültige E-Mail-Adresse an.';
    }

    if (!isLikelyPhoneNumber(draft.requesterPhone)) {
      return 'Bitte geben Sie eine Telefonnummer an, unter der Rückfragen möglich sind.';
    }

    if (!isLikelyAge(draft.personAge)) {
      return 'Bitte tragen Sie ein plausibles Alter der betroffenen Person ein.';
    }

    return '';
  }

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

  function formatValue(field, value) {
    if (Array.isArray(value)) return value.join(', ');
    return String(value || '').trim();
  }

  function isQuestionVisible(question, draft) {
    if (typeof question.showWhen === 'function' && !question.showWhen(draft)) {
      return false;
    }
    return true;
  }

  function isFieldMissing(field, draft) {
    if (!field.required) return false;
    const value = draft[field.id];
    return Array.isArray(value) ? value.length === 0 : !String(value || '').trim();
  }

  function getRequiredMissingForSection(section, draft) {
    return section.fields.filter((field) => isQuestionVisible(field, draft) && isFieldMissing(field, draft));
  }

  function getActiveQuestions(state) {
    const visibleQuestions = SECTIONS.flatMap((section, sectionIndex) =>
      section.fields
        .filter((field) => isQuestionVisible(field, state.draft))
        .map((field, fieldIndex) => ({
          ...field,
          sectionTitle: section.title,
          sectionIntro: section.intro,
          sectionIndex,
          fieldIndex,
        }))
    );

    const sectionCounts = new Map();
    const visibleSectionIndexes = [];
    visibleQuestions.forEach((question) => {
      sectionCounts.set(question.sectionIndex, (sectionCounts.get(question.sectionIndex) || 0) + 1);
      if (!visibleSectionIndexes.includes(question.sectionIndex)) {
        visibleSectionIndexes.push(question.sectionIndex);
      }
    });

    const sectionOrder = new Map(visibleSectionIndexes.map((sectionIndex, orderIndex) => [sectionIndex, orderIndex + 1]));
    const sectionProgress = new Map();

    return visibleQuestions.map((question) => {
      const position = (sectionProgress.get(question.sectionIndex) || 0) + 1;
      sectionProgress.set(question.sectionIndex, position);
      return {
        ...question,
        visibleSectionPosition: sectionOrder.get(question.sectionIndex) || 1,
        visibleSectionCount: visibleSectionIndexes.length,
        sectionQuestionCount: sectionCounts.get(question.sectionIndex) || 1,
        sectionQuestionPosition: position,
      };
    });
  }

  function getVisibleSections(state) {
    const visibleSectionIndexes = new Set(getActiveQuestions(state).map((question) => question.sectionIndex));
    return SECTIONS.map((section, index) => ({ section, index })).filter(({ index }) => visibleSectionIndexes.has(index));
  }

  function getFirstIncompleteQuestionIndex(state) {
    const questions = getActiveQuestions(state);
    const index = questions.findIndex((question) => isFieldMissing(question, state.draft));
    return index >= 0 ? index : Math.max(questions.length - 1, 0);
  }

  function normalizeCurrentStep(state) {
    const questions = getActiveQuestions(state);
    state.currentStep = Math.max(0, Math.min(state.currentStep, questions.length));
    return questions;
  }

  function getFieldHelpText(field) {
    return field.help || FIELD_HELP_TEXTS[field.id] || DEFAULT_FIELD_HELP;
  }

  function renderFieldLabel(field, inputId) {
    const labelTarget = inputId ? ` for="${escapeHtml(inputId)}"` : '';
    return `
      <div class="planning-label-row">
        <label class="planning-label"${labelTarget}>${escapeHtml(field.label)}${field.required ? ' <span>*</span>' : ''}</label>
        <span class="planning-help" tabindex="0" aria-label="Mehr Informationen zu ${escapeHtml(field.label)}">
          <span class="planning-help-icon" aria-hidden="true">?</span>
          <span class="planning-help-tooltip">${escapeHtml(getFieldHelpText(field))}</span>
        </span>
      </div>
    `;
  }

  function renderField(field, draft) {
    const value = draft[field.id];
    const fieldClass = field.wide ? 'planning-field planning-field-wide' : 'planning-field';

    if (field.type === 'radio') {
      return `
        <div class="${fieldClass}">
          ${renderFieldLabel(field)}
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
          ${renderFieldLabel(field)}
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
          ${renderFieldLabel(field, field.id)}
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
          ${renderFieldLabel(field, field.id)}
          <textarea id="${escapeHtml(field.id)}" name="${escapeHtml(field.id)}" rows="${field.rows || 4}" placeholder="${escapeHtml(field.placeholder || '')}">${escapeHtml(value || '')}</textarea>
        </div>
      `;
    }

    const inputType = field.type || 'text';
    return `
      <div class="${fieldClass}">
        ${renderFieldLabel(field, field.id)}
        <input id="${escapeHtml(field.id)}" type="${escapeHtml(inputType)}" name="${escapeHtml(field.id)}" value="${escapeHtml(value || '')}" placeholder="${escapeHtml(field.placeholder || '')}">
      </div>
    `;
  }

  function getAllMissingRequired(state) {
    return SECTIONS.flatMap((section) => getRequiredMissingForSection(section, state.draft).map((field) => field.label));
  }

  function renderReview(state) {
    const draft = state.draft;
    const missingFields = Array.from(new Set(getAllMissingRequired(state)));
    const reviewGroups = [
      ['Kontaktdaten', `${draft.requesterFirstName || ''} ${draft.requesterLastName || ''}`.trim(), draft.relationshipToPerson || '', draft.requesterPhone || '', draft.requesterEmail || ''],
      ['Betroffene Person', `${draft.personFirstName || ''} ${draft.personLastName || ''}`.trim(), draft.personAge || '', draft.personCity || '', draft.livingArrangement || ''],
      ['Pflegesituation', draft.hasCareLevel || '', draft.careLevelValue || '', draft.careRequestType || '', draft.applicationAlreadySubmitted || '', draft.assessmentAppointmentSet || '', draft.insuranceProvider || ''],
      ['Unterstützungsbedarf', formatValue(null, draft.supportNeeds), draft.difficultActivities || '', draft.basicCareProblems || '', draft.currentDailySupport || ''],
      ['Gesundheit & Ziel', draft.diagnosesAndLimitations || '', formatValue(null, draft.availableAids), draft.desiredSupport || '', draft.currentQuestions || ''],
    ];

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
      <div class="planning-validation-card${missingFields.length ? ' is-warning' : ' is-ready'}">
        <div>
          <h3>Letzter Check vor der Zahlung</h3>
          <p>${missingFields.length ? 'Es fehlen noch einige Pflichtangaben. Bitte ergänzen Sie diese vor dem Abschluss.' : 'Alle Pflichtangaben sind vorhanden. Sie können den Vorgang jetzt kostenpflichtig abschließen.'}</p>
        </div>
        ${missingFields.length ? `<div class="planning-validation-list"><strong>Fehlt noch:</strong><ul>${missingFields.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
      </div>
      <div class="planning-payment-box">
        <div>
          <span class="planning-payment-price">${PACKAGE_PRICE_LABEL}</span>
          <p>Nach erfolgreicher Mollie-Zahlung werden Ihre Angaben automatisch per Web3Forms an meine E-Mail übermittelt. Sie müssen danach nichts separat absenden.</p>
        </div>
        <div class="planning-payment-actions">
          <button class="btn primary" type="button" data-action="checkout" ${missingFields.length ? 'disabled' : ''}>Jetzt kostenpflichtig abschliessen</button>
        </div>
      </div>
    `;
  }

  function renderQuestionShell(state, question, questions) {
    const progressValue = Math.max(4, Math.round(((state.currentStep + 1) / (questions.length + 1)) * 100));
    const currentSection = SECTIONS[question.sectionIndex];
    const currentMissing = isFieldMissing(question, state.draft);
    const visibleSections = getVisibleSections(state);

    return `
      <div class="planning-app-frame">
        <div class="planning-app-status">
          <div>
            <span class="planning-eyebrow">Frage ${state.currentStep + 1} von ${questions.length}</span>
            <strong class="planning-app-title">${escapeHtml(question.sectionTitle)}</strong>
          </div>
          <div class="planning-app-actions-top">
            <span class="planning-save-indicator"><i class="fa-solid fa-cloud-arrow-up"></i> Automatisch gespeichert</span>
          </div>
        </div>
        <div class="planning-progress-bar" aria-hidden="true">
          <span class="planning-progress-bar-fill" style="width:${progressValue}%"></span>
        </div>
        <div class="planning-section-strip" aria-hidden="true">
          ${visibleSections.map(({ section, index }, visibleIndex) => {
            const isActive = index === question.sectionIndex;
            const isComplete = index < question.sectionIndex || getRequiredMissingForSection(section, state.draft).length === 0;
            return `<span class="planning-section-pill${isActive ? ' is-active' : ''}${isComplete ? ' is-complete' : ''}">${visibleIndex + 1}. ${escapeHtml(section.title)}</span>`;
          }).join('')}
        </div>
      </div>
      <div class="planning-main-card planning-question-card">
        <div class="planning-main-head planning-main-head--stack">
          <div>
            <span class="planning-question-count">Abschnitt ${question.visibleSectionPosition} von ${question.visibleSectionCount} · Frage ${question.sectionQuestionPosition} von ${question.sectionQuestionCount}</span>
            <h2>${escapeHtml(question.label)}</h2>
            <p>${escapeHtml(currentSection.intro)}</p>
          </div>
          <div class="planning-progress-meter planning-progress-meter--compact">
            <strong>${progressValue}%</strong>
            <span>Fortschritt</span>
          </div>
        </div>
        ${currentMissing && state.showValidation ? '<div class="planning-inline-warning"><i class="fa-solid fa-circle-exclamation"></i> Bitte beantworten Sie diese Pflichtfrage, bevor Sie weitergehen.</div>' : ''}
        <div class="planning-stage-body planning-stage-body--single">
          ${renderField(question, state.draft)}
        </div>
        <div class="planning-footer-actions">
          <button class="btn ghost" type="button" data-action="prev" ${state.currentStep === 0 ? 'disabled' : ''}><i class="fa-solid fa-arrow-left"></i> Zurück</button>
          <span class="planning-footer-note">${question.required ? 'Pflichtfrage' : 'Optional, Sie können sie überspringen.'}</span>
          <div class="planning-footer-buttons">
            ${!question.required ? '<button class="btn ghost" type="button" data-action="skip">Überspringen</button>' : ''}
            <button class="btn primary" type="button" data-action="next">${state.currentStep === questions.length - 1 ? 'Zur Übersicht' : 'Weiter'}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderApp(root, state) {
    const questions = normalizeCurrentStep(state);
    const isReview = state.currentStep === questions.length;
    const question = isReview ? null : questions[state.currentStep];
    const reviewProgress = 100;

    root.innerHTML = `
      <div class="planning-shell">
        ${isReview
          ? `
            <div class="planning-app-frame planning-app-frame--review">
              <div class="planning-app-status">
                <div>
                  <span class="planning-eyebrow">Abschluss</span>
                  <strong class="planning-app-title">Angaben prüfen und Zahlung starten</strong>
                </div>
                <span class="planning-save-indicator"><i class="fa-solid fa-check"></i> Eingaben gesichert</span>
              </div>
              <div class="planning-progress-bar" aria-hidden="true">
                <span class="planning-progress-bar-fill" style="width:${reviewProgress}%"></span>
              </div>
            </div>
            <div class="planning-main-card">
              <div class="planning-main-head planning-main-head--stack">
                <div>
                  <span class="planning-eyebrow">Letzter Schritt</span>
                  <h2>Angaben prüfen und zahlen</h2>
                  <p>Hier sehen Sie die wichtigsten Angaben gesammelt. Wenn alles passt, können Sie jetzt die Mollie-Zahlung starten.</p>
                </div>
                <div class="planning-progress-meter planning-progress-meter--compact">
                  <strong>${reviewProgress}%</strong>
                  <span>Fortschritt</span>
                </div>
              </div>
              <div class="planning-stage-body">
                ${renderReview(state)}
              </div>
              <div class="planning-footer-actions">
                <button class="btn ghost" type="button" data-action="prev"><i class="fa-solid fa-arrow-left"></i> Zurück</button>
                <div class="planning-footer-buttons">
                  <button class="btn ghost" type="button" data-action="goto-form"><i class="fa-solid fa-pen-to-square"></i> Fehlende Angaben öffnen</button>
                </div>
              </div>
            </div>
          `
          : renderQuestionShell(state, question, questions)}
      </div>
    `;
  }

  function collectFieldValue(root, field, draft) {
    const nextDraft = { ...draft };
    if (!field) return nextDraft;
    if (field.type === 'checkbox') {
      nextDraft[field.id] = Array.from(root.querySelectorAll(`input[name="${field.id}"]:checked`)).map((input) => input.value);
      return nextDraft;
    }
    if (field.type === 'radio') {
      nextDraft[field.id] = root.querySelector(`input[name="${field.id}"]:checked`)?.value || '';
      return nextDraft;
    }
    nextDraft[field.id] = root.querySelector(`[name="${field.id}"]`)?.value?.trim() || '';
    return nextDraft;
  }

  function buildApplicantName(draft) {
    return `${draft.requesterFirstName || ''} ${draft.requesterLastName || ''}`.trim();
  }

  async function startCheckout(state) {
    if (getAllMissingRequired(state).length > 0) {
      alert('Bitte füllen Sie zuerst alle Pflichtangaben aus.');
      return;
    }

    const applicantName = buildApplicantName(state.draft);
    if (!applicantName || !state.draft.requesterEmail) {
      alert('Bitte ergänzen Sie Vorname, Nachname und E-Mail-Adresse der anfragenden Person.');
      return;
    }

    const validationMessage = validateCheckoutDraft(state.draft);
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    const checkoutButton = document.querySelector('[data-action="checkout"]');
    if (checkoutButton) {
      checkoutButton.disabled = true;
      checkoutButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Weiter zu Mollie';
    }

    try {
      const response = await fetch('/api/pflegegrad/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicantName,
          customerEmail: state.draft.requesterEmail,
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
      };
      saveOrders(orders);

      window.location.href = data.checkoutUrl;
    } catch (error) {
      alert('Die Zahlung konnte gerade nicht gestartet werden. Bitte versuchen Sie es erneut.');
      if (checkoutButton) {
        checkoutButton.disabled = false;
        checkoutButton.innerHTML = 'Jetzt kostenpflichtig abschließen';
      }
    }
  }

  async function initPflegegradApp(root) {
    const state = {
      currentStep: 0,
      draft: loadJson(DRAFT_STORAGE_KEY, {}),
      showValidation: false,
      autoAdvanceTimer: null,
    };

    const rerender = () => {
      renderApp(root, state);
      const preferredFocus = root.querySelector('textarea, select, input[type="text"], input[type="email"], input[type="tel"]');
      preferredFocus?.focus({ preventScroll: true });
    };

    function clearAutoAdvance() {
      if (state.autoAdvanceTimer) {
        window.clearTimeout(state.autoAdvanceTimer);
        state.autoAdvanceTimer = null;
      }
    }

    function moveToNextQuestion() {
      const questions = getActiveQuestions(state);
      state.showValidation = false;
      state.currentStep = Math.min(questions.length, state.currentStep + 1);
      rerender();
    }

    function canAutoAdvance(question) {
      return Boolean(question) && (question.type === 'radio' || question.type === 'select');
    }

    function scheduleAutoAdvance() {
      clearAutoAdvance();
      state.autoAdvanceTimer = window.setTimeout(() => {
        state.autoAdvanceTimer = null;
        const questions = getActiveQuestions(state);
        const currentQuestion = questions[state.currentStep];
        if (!currentQuestion || isFieldMissing(currentQuestion, state.draft)) {
          return;
        }
        moveToNextQuestion();
      }, 180);
    }

    rerender();

    root.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;

      const action = button.getAttribute('data-action');
      const questions = getActiveQuestions(state);
      clearAutoAdvance();
      if (state.currentStep < questions.length) {
        state.draft = collectFieldValue(root, questions[state.currentStep], state.draft);
        saveJson(DRAFT_STORAGE_KEY, state.draft);
      }

      if (action === 'prev' && state.currentStep > 0) {
        state.currentStep -= 1;
        state.showValidation = false;
        rerender();
      }

      if (action === 'next') {
        const currentQuestion = questions[state.currentStep];
        if (currentQuestion && isFieldMissing(currentQuestion, state.draft)) {
          state.showValidation = true;
          rerender();
          return;
        }
        moveToNextQuestion();
      }

      if (action === 'skip') {
        moveToNextQuestion();
      }

      if (action === 'goto-form') {
        state.currentStep = getFirstIncompleteQuestionIndex(state);
        state.showValidation = false;
        rerender();
      }

      if (action === 'checkout') {
        await startCheckout(state);
      }
    });

    root.addEventListener('change', (event) => {
      const target = event.target;
      const questions = getActiveQuestions(state);
      if (state.currentStep < questions.length) {
        state.draft = collectFieldValue(root, questions[state.currentStep], state.draft);
        saveJson(DRAFT_STORAGE_KEY, state.draft);
        state.showValidation = false;
        if (target.matches('input[type="radio"], input[type="checkbox"], select')) {
          rerender();
        }
        const currentQuestion = getActiveQuestions(state)[state.currentStep];
        if (canAutoAdvance(currentQuestion) && !isFieldMissing(currentQuestion, state.draft)) {
          scheduleAutoAdvance();
        }
      }
    });

    root.addEventListener('input', () => {
      const questions = getActiveQuestions(state);
      clearAutoAdvance();
      if (state.currentStep < questions.length) {
        state.draft = collectFieldValue(root, questions[state.currentStep], state.draft);
        saveJson(DRAFT_STORAGE_KEY, state.draft);
        state.showValidation = false;
      }
    });
  }

  function buildEmailMessage(orderRef, order, paymentStatus) {
    const draft = order.draft || {};
    const applicantName = buildApplicantName(draft);
    const sectionLines = SECTIONS.map((section) => {
      const entries = section.fields
        .map((field) => {
          const value = formatValue(field, draft[field.id]);
          return value ? `${field.label}: ${value}` : '';
        })
        .filter(Boolean);

      return entries.length ? [`${section.title}:`, ...entries, ''] : [];
    }).flat();

    const lines = [
      'Neue Bestellung: Pflegegrad-Startpaket',
      '',
      `Vorgangsnummer: ${orderRef}`,
      `Anfragende Person: ${applicantName}`,
      `E-Mail: ${draft.requesterEmail || paymentStatus.customerEmail || ''}`,
      `Telefon: ${draft.requesterPhone || ''}`,
      `Status: ${paymentStatus.status}`,
      '',
      `Betroffene Person: ${(draft.personFirstName || '')} ${(draft.personLastName || '')}`.trim(),
      `Pflegekasse: ${draft.insuranceProvider || ''}`,
      `Art des Antrags: ${draft.careRequestType || ''}`,
      '',
      ...sectionLines,
    ];

    return lines.join('\n');
  }

  async function sendPflegegradOrder(orderRef, order, paymentStatus) {
    const applicantName = buildApplicantName(order.draft) || paymentStatus.applicantName || 'Pflegegrad-Startpaket';
    const formData = new FormData();

    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', `Pflegegrad-Startpaket | ${applicantName} | ${orderRef}`);
    formData.append('from_name', 'casekompass.de Pflegegrad-Startpaket');
    formData.append('name', applicantName);
    formData.append('email', order.draft.requesterEmail || paymentStatus.customerEmail || 'casekompass@gmx.de');
    formData.append('message', buildEmailMessage(orderRef, order, paymentStatus));
    formData.append('botcheck', '');

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || 'Web3Forms submission failed');
    }
  }

  async function loadPflegegradPaymentStatus(token) {
    const response = await fetch('/api/pflegegrad/payment-status', {
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

  async function initPflegegradStatus(root) {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || '';

    if (!token) {
      root.classList.add('is-warning');
      root.innerHTML = `
        <div class="shop-status-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
        <h2>Kein gültiger Link</h2>
        <p>Für diesen Vorgang fehlt der Token. Bitte starten Sie das Pflegegrad-Formular erneut.</p>
        <div class="shop-status-actions">
          <a class="btn primary" href="pflegegrad-startpaket-starten.html"><i class="fa-solid fa-arrow-left"></i> Zum Formular</a>
          <a class="btn ghost" href="kontakt.html"><i class="fa-regular fa-envelope"></i> Kontakt</a>
        </div>
      `;
      return;
    }

    try {
      const paymentStatus = await loadPflegegradPaymentStatus(token);

      if (!paymentStatus.isPaid) {
        let title = 'Zahlung noch nicht bestätigt';
        let message = `Der aktuelle Status ist ${escapeHtml(paymentStatus.status)}. Sobald die Zahlung bestätigt ist, werden Ihre Angaben automatisch erfasst.`;

        if (paymentStatus.isPending) {
          title = 'Zahlung wird noch verarbeitet';
          message = 'Mollie verarbeitet die Zahlung noch. Bitte laden Sie die Seite in kurzer Zeit erneut.';
        } else if (paymentStatus.isCanceled) {
          title = 'Zahlung abgebrochen';
          message = 'Die Zahlung wurde abgebrochen. Wenn Sie das Paket weiter buchen möchten, starten Sie den Vorgang bitte erneut.';
        } else if (paymentStatus.isFailed) {
          title = 'Zahlung fehlgeschlagen';
          message = 'Die Zahlung konnte nicht abgeschlossen werden. Bitte starten Sie den Vorgang erneut oder melden Sie sich direkt.';
        } else if (paymentStatus.isExpired) {
          title = 'Zahlung abgelaufen';
          message = 'Der Zahlungslink ist abgelaufen. Bitte starten Sie das Formular erneut, falls Sie das Paket weiterhin buchen möchten.';
        }

        root.classList.add('is-warning');
        root.innerHTML = `
          <div class="shop-status-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
          <h2>${title}</h2>
          <p>${message}</p>
          <div class="shop-status-actions">
            <a class="btn primary" href="pflegegrad-startpaket-starten.html"><i class="fa-solid fa-rotate-right"></i> Zurück zum Formular</a>
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
          <h2>Angaben bereits übermittelt</h2>
          <p>Ihre Angaben wurden bereits erfolgreich an mich übermittelt. Ich melde mich mit dem Pflegegrad-Startpaket schnellstmöglich bei Ihnen.</p>
          <div class="shop-status-actions">
            <a class="btn ghost" href="pflegegrad-startpaket-starten.html"><i class="fa-solid fa-arrow-left"></i> Zurück zum Formular</a>
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
            <a class="btn ghost" href="pflegegrad-startpaket-starten.html"><i class="fa-solid fa-arrow-left"></i> Zurück</a>
          </div>
        `;
        return;
      }

      await sendPflegegradOrder(paymentStatus.orderRef, order, paymentStatus);

      dispatched[paymentStatus.orderRef] = {
        sentAt: new Date().toISOString(),
      };
      saveDispatchedOrders(dispatched);
      saveJson(DRAFT_STORAGE_KEY, {});

      root.classList.add('is-success');
      root.innerHTML = `
        <div class="shop-status-icon"><i class="fa-solid fa-paper-plane"></i></div>
        <h2>Angaben erfolgreich übermittelt</h2>
        <p>Ihre Zahlung ist bestätigt und Ihre Angaben wurden an mich übermittelt. Ich melde mich für das Pflegegrad-Startpaket schnellstmöglich bei Ihnen. Falls Sie innerhalb kurzer Zeit keine Rückmeldung sehen, schreiben Sie mir bitte direkt.</p>
        <div class="shop-status-actions">
          <a class="btn ghost" href="pflegegrad-startpaket-starten.html"><i class="fa-solid fa-arrow-left"></i> Zurück zum Formular</a>
          <a class="btn ghost" href="kontakt.html"><i class="fa-regular fa-envelope"></i> Kontakt</a>
        </div>
      `;
    } catch (error) {
      root.classList.add('is-warning');
      root.innerHTML = `
        <div class="shop-status-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
        <h2>Abschluss konnte nicht automatisch übermittelt werden</h2>
        <p>Die Zahlung wurde geprüft, aber die Übermittlung Ihrer Angaben ist gerade fehlgeschlagen. Bitte laden Sie die Seite erneut oder melden Sie sich direkt.</p>
        <div class="shop-status-actions">
          <a class="btn primary" href="pflegegrad-startpaket-starten.html"><i class="fa-solid fa-arrow-left"></i> Zurück zum Formular</a>
          <a class="btn ghost" href="kontakt.html"><i class="fa-regular fa-envelope"></i> Kontakt</a>
        </div>
      `;
    }
  }

  const appRoot = document.querySelector('[data-pflegegrad-app]');
  const statusRoot = document.querySelector('[data-pflegegrad-status]');

  if (appRoot) {
    initPflegegradApp(appRoot);
  }

  if (statusRoot) {
    initPflegegradStatus(statusRoot);
  }
})();