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
  const DEFAULT_FIELD_HELP = 'Tragen Sie hier die Angabe so ein, wie sie aktuell für die betroffene Person am besten passt.';

  function textField(id, label, options) {
    return { id, label, type: 'text', ...options };
  }

  function textareaField(id, label, options) {
    return { id, label, type: 'textarea', rows: 4, ...options };
  }

  function selectField(id, label, options, extra) {
    return { id, label, type: 'select', options, ...extra };
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
        textField('careLevelValue', 'Falls ja: welcher Pflegegrad?', { placeholder: 'z. B. Pflegegrad 2', showWhen: (draft) => draft.hasCareLevel === 'Ja' }),
        yesNoField('hasDisabilityCard', 'Schwerbehindertenausweis vorhanden?', { required: true }),
        yesNoField('hasLegalSupport', 'Gesetzliche Betreuung oder Vollmacht vorhanden?', { required: true }),
      ],
    },
    {
      title: 'Wer füllt aus?',
      intro: 'Wer die Angaben macht, ist für Rückfragen und Einschätzung wichtig.',
      fields: [
        radioField('filledByRole', 'Wer füllt das Formular gerade aus?', ['Betroffene Person selbst', 'Angehörige Person', 'Bevollmächtigte Person', 'Gesetzliche Betreuung', 'Andere Bezugsperson']),
        textareaField('filledByContact', 'Name und Kontaktdaten dieser Person', { required: true, wide: true, placeholder: 'Name, Telefon, E-Mail und Beziehung zur betroffenen Person' }),
      ],
    },
    {
      title: 'Hauptsituation',
      intro: 'Worum geht es aktuell und warum wird jetzt Hilfe benötigt?',
      fields: [
        selectField('requestReason', 'Worum geht es im Kern?', ['Pflegegrad oder Begutachtung', 'Versorgung zuhause sichern', 'Angehörige entlasten', 'Hilfsmittel organisieren', 'Reha oder Krankenhaus-Nachsorge', 'Behörden oder Unterlagen klären', 'Wohnraumanpassung', 'Sonstiges oder unklar'], { required: true, wide: true }),
        textareaField('mainProblem', 'Was belastet aktuell am meisten?', { required: true, wide: true, placeholder: 'Beschreiben Sie das Hauptproblem in 2 bis 4 Sätzen.' }),
        selectField('situationSince', 'Seit wann besteht die Situation?', ['Seit wenigen Tagen', 'Seit einigen Wochen', 'Seit einigen Monaten', 'Seit mehr als einem halben Jahr', 'Schon länger, aber aktuell deutlich belastender'], { required: true }),
        yesNoField('recentlyWorsened', 'Hat sich die Lage kürzlich verschlechtert?', { required: true }),
        textareaField('recentHospitalRehabFall', 'Gab es Krankenhaus, Reha oder Sturz in letzter Zeit?', { wide: true, placeholder: 'Wenn ja: kurz mit Zeitraum und Folgen beschreiben', showWhen: (draft) => draft.recentlyWorsened === 'Ja' || draft.requestReason === 'Reha oder Krankenhaus-Nachsorge' }),
      ],
    },
    {
      title: 'Diagnosen & Gesundheit',
      intro: 'Die gesundheitliche Lage bestimmt den Versorgungsbedarf direkt mit.',
      fields: [
        checkboxField('mainDiagnoses', 'Welche Diagnosen oder Themen prägen die Lage besonders?', ['Schlaganfall', 'Demenz', 'Parkinson', 'Herz-Kreislauf-Erkrankung', 'Orthopädische Einschränkungen', 'Chronische Schmerzen', 'Psychische Erkrankung', 'Tumorerkrankung', 'Mehrere Diagnosen', 'Noch nicht klar'], { required: true, wide: true }),
        textareaField('mainDiagnosesDetails', 'Weitere wichtige Diagnosen oder kurze Ergänzungen', { wide: true, askInQuickFlow: false, showWhen: (draft) => Array.isArray(draft.mainDiagnoses) && draft.mainDiagnoses.length > 0 }),
        checkboxField('physicalLimitations', 'Körperliche Einschränkungen', ['Schwäche', 'Lähmungen', 'Gleichgewichtsprobleme', 'Erschöpfung', 'Belastbarkeit stark reduziert', 'Feinmotorik eingeschränkt'], { wide: true, askInQuickFlow: false }),
        checkboxField('psychologicalBurden', 'Psychische Belastungen', ['Überforderung', 'Ängste', 'Depressive Stimmung', 'Unruhe', 'Aggression', 'Rückzug'], { wide: true, askInQuickFlow: false }),
        checkboxField('cognitiveLimitations', 'Kognitive Einschränkungen', ['Vergesslichkeit', 'Konzentrationsprobleme', 'Orientierungsprobleme', 'Entscheidungen fallen schwer', 'Verlangsamtes Denken'], { wide: true, askInQuickFlow: false }),
        yesNoField('dementiaIssues', 'Demenz, deutliche Vergesslichkeit oder Orientierungsschwierigkeiten?', { required: true }),
        selectField('painIssues', 'Schmerzen', ['Keine oder kaum', 'Leicht', 'Mittel', 'Stark', 'Sehr stark oder täglich belastend'], { wide: true, askInQuickFlow: false }),
        checkboxField('sensoryIssues', 'Seh- oder Hörprobleme', ['Sehen eingeschränkt', 'Hören eingeschränkt', 'Brille oder Hörgerät vorhanden', 'Keine relevanten Probleme'], { wide: true, askInQuickFlow: false }),
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
        selectField('fallRisk', 'Sturzgefahr?', ['Keine erkennbare Sturzgefahr', 'Leicht erhöht', 'Deutlich erhöht', 'Es gab bereits Stürze'], { wide: true }),
        textareaField('transferSupport', 'Transfer-Hilfe nötig? z. B. Bett, Toilette, Dusche', { wide: true, showWhen: (draft) => draft.canStandUpAlone === 'Nein' || draft.canWalkIndoors === 'Nein' }),
      ],
    },
    {
      title: 'Selbstversorgung',
      intro: 'Wo ist Hilfe im Alltag bereits nötig und wo funktionieren Dinge noch?',
      fields: [
        checkboxField('dailyLimitationAreas', 'Wo bestehen die größten Alltagseinschränkungen?', ['Körperpflege', 'Anziehen', 'Essen und Trinken', 'Toilettengang', 'Medikamente', 'Haushalt', 'Einkaufen', 'Kochen', 'Ordnung oder Wäsche'], { required: true, wide: true }),
        textareaField('dailyLimitations', 'Kurz beschrieben: Wo klappt der Alltag gerade nicht gut?', { required: true, wide: true, placeholder: 'Zum Beispiel morgens, beim Essen, im Bad oder bei der Organisation.' }),
        checkboxField('helpAreas', 'Wo ist aktuell konkret Hilfe nötig?', ['Waschen oder Duschen', 'Anziehen', 'Essen oder Trinken', 'Toilettengang', 'Medikamente', 'Haushaltsführung', 'Einkaufen', 'Kochen', 'Reinigung oder Wäsche'], { wide: true, askInQuickFlow: false, showWhen: (draft) => Array.isArray(draft.dailyLimitationAreas) && draft.dailyLimitationAreas.length > 0 }),
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
        textareaField('stressBehavior', 'Ängste, Aggression oder Überforderung', { wide: true, askInQuickFlow: false, showWhen: (draft) => draft.dementiaIssues === 'Ja' || draft.nighttimeUnrest === 'Ja' || draft.wanderingRisk === 'Ja' }),
        yesNoField('needsSupervision', 'Braucht Beaufsichtigung?', { required: true }),
        yesNoField('understandsLetters', 'Kann Schriftstücke oder Briefe noch verstehen?', { required: true }),
      ],
    },
    {
      title: 'Bestehende Versorgung',
      intro: 'Was ist bereits organisiert und wo reißt die Versorgung noch auf?',
      fields: [
        textareaField('currentHelpers', 'Wer hilft aktuell?', { required: true, wide: true }),
        checkboxField('helperTypes', 'Welche Unterstützung ist aktuell eingebunden?', ['Angehörige', 'Nachbarn', 'Pflegedienst', 'Haushaltshilfe', 'Ergotherapie', 'Physiotherapie', 'Logopädie', 'Tagespflege', 'Essen auf Rädern', 'Hausnotruf', 'Betreuungsdienst'], { wide: true, askInQuickFlow: false }),
        textareaField('helperFrequency', 'Wie oft kommt wer?', { wide: true, askInQuickFlow: false }),
        textareaField('whatWorksWell', 'Was funktioniert gut?', { wide: true, askInQuickFlow: false }),
        checkboxField('currentGapAreas', 'Wo gibt es Versorgungslücken?', ['Zu wenig Entlastung', 'Keine klare Zuständigkeit', 'Hilfsmittel fehlen', 'Pflegedienst reicht nicht aus', 'Anträge oder Unterlagen fehlen', 'Organisation überfordert die Familie'], { wide: true, askInQuickFlow: false }),
        textareaField('currentGaps', 'Was fehlt aktuell am dringendsten?', { required: true, wide: true, placeholder: 'Zum Beispiel mehr Entlastung, klare Struktur, Hilfsmittel oder Unterstützung bei Anträgen.' }),
      ],
    },
    {
      title: 'Wichtige Kontakte',
      intro: 'Hier sammeln Sie alle medizinischen und organisatorischen Ansprechpersonen.',
      fields: [
        textField('familyDoctor', 'Hausarzt', { wide: true, askInQuickFlow: false }),
        textareaField('specialists', 'Fachärzte', { wide: true, askInQuickFlow: false }),
        textareaField('therapists', 'Therapeuten', { wide: true, askInQuickFlow: false }),
        textField('pharmacy', 'Apotheke', { wide: true, askInQuickFlow: false }),
        textField('medicalSupplyStore', 'Sanitätshaus', { wide: true, askInQuickFlow: false }),
        checkboxField('careServiceContactTypes', 'Welche professionellen Stellen sind aktuell eingebunden?', ['Pflegedienst', 'Ergotherapie', 'Physiotherapie', 'Logopädie', 'Tagespflege', 'Betreuungsdienst', 'Sozialdienst'], { wide: true, askInQuickFlow: false }),
        textareaField('careServiceContact', 'Pflegedienst oder weitere Dienste', { wide: true, askInQuickFlow: false }),
        textareaField('clinicContact', 'Ansprechpartner in Klinik, Reha oder Sozialdienst', { wide: true, askInQuickFlow: false }),
        textareaField('relativeContacts', 'Wichtige Angehörige mit Telefonnummern', { wide: true, askInQuickFlow: false }),
      ],
    },
    {
      title: 'Anträge & Bescheide',
      intro: 'Welche Anträge laufen schon und welche Bescheide oder Ablehnungen gibt es?',
      fields: [
        yesNoField('careLevelApplied', 'Pflegegrad beantragt?', { required: true }),
        textField('careLevelExisting', 'Pflegegrad vorhanden, welcher?', { wide: true, askInQuickFlow: false, showWhen: (draft) => draft.hasCareLevel === 'Ja' || draft.careLevelApplied === 'Ja' }),
        yesNoField('objectionRunning', 'Widerspruch aktuell?', { required: true }),
        yesNoField('aidsApplied', 'Hilfsmittel beantragt?', { required: true }),
        yesNoField('rehabApplied', 'Reha beantragt?', { required: true }),
        yesNoField('homeAdaptationApplied', 'Wohnraumanpassung beantragt?', { required: true }),
        yesNoField('reliefAmountUsed', 'Entlastungsbetrag genutzt?', { required: true }),
        yesNoField('careAidsUsed', 'Pflegehilfsmittel genutzt?', { required: true }),
        yesNoField('shortTermCareUsed', 'Verhinderungspflege oder Kurzzeitpflege schon genutzt?', { required: true }),
        textareaField('availableDocuments', 'Welche Unterlagen oder Bescheide liegen schon vor?', { required: true, wide: true }),
        checkboxField('rejectedTopics', 'Was wurde schon abgelehnt?', ['Pflegegrad', 'Hilfsmittel', 'Reha', 'Wohnraumanpassung', 'Pflegedienst oder Leistungsausweitung', 'Entlastungsleistungen'], { wide: true, askInQuickFlow: false }),
        textareaField('rejectedItems', 'Was wurde schon abgelehnt?', { wide: true, askInQuickFlow: false, showWhen: (draft) => Array.isArray(draft.rejectedTopics) && draft.rejectedTopics.length > 0 }),
      ],
    },
    {
      title: 'Wohnsituation',
      intro: 'Die Wohnumgebung entscheidet oft mit darüber, was sofort verbessert werden sollte.',
      fields: [
        textField('livingSituation', 'Wie lebt die Person aktuell?', { required: true, wide: true, placeholder: 'Zum Beispiel allein, mit Partner, mit Familie oder in einer WG.' }),
        { id: 'housingType', label: 'Wie ist die Wohnform?', type: 'select', required: true, options: ['Wohnung', 'Haus', 'Sonstiges', 'Weiß ich nicht'] },
        textField('floor', 'Stockwerk', { askInQuickFlow: false, showWhen: (draft) => draft.housingType === 'Wohnung' || draft.housingType === 'Haus' }),
        yesNoField('hasElevator', 'Aufzug vorhanden?', { required: true, showWhen: (draft) => draft.housingType === 'Wohnung' }),
        yesNoField('hasAccessibleBathroom', 'Bad barrierefrei?', { required: true }),
        yesNoField('hasStairsAtHome', 'Treppen im Haus?', { required: true }),
        { id: 'bathSetup', label: 'Wie ist das Bad ausgestattet?', type: 'select', required: true, options: ['Dusche', 'Badewanne', 'Beides', 'Sonstiges', 'Weiß ich nicht'] },
        yesNoField('bedAccessible', 'Bett oder Schlafzimmer gut erreichbar?', { required: true }),
        textareaField('tripHazards', 'Gibt es Stolperfallen?', { wide: true, askInQuickFlow: false, showWhen: (draft) => draft.hasStairsAtHome === 'Ja' || draft.canWalkIndoors === 'Nein' }),
        yesNoField('renovationUseful', 'Wäre Umbau sinnvoll?', { required: true }),
        yesNoField('hasPets', 'Haustiere vorhanden?', { required: true }),
        selectField('areaType', 'Eher ländlich oder städtisch?', ['Städtisch', 'Ländlich', 'Dazwischen'], { required: true }),
        yesNoField('easyToReach', 'Wohnort gut erreichbar?', { required: true }),
        textareaField('petsAndAccess', 'Sonstige Hinweise zur Wohnlage oder Erreichbarkeit', { wide: true, askInQuickFlow: false, showWhen: (draft) => draft.hasPets === 'Ja' || draft.easyToReach === 'Nein' }),
      ],
    },
    {
      title: 'Ziele der Familie',
      intro: 'Das Zielbild ist der wichtigste Teil für eine starke Versorgungsplanung.',
      fields: [
        textareaField('improvementGoal', 'Was soll sich konkret verbessern?', { required: true, wide: true, placeholder: 'Beschreiben Sie den gewünschten Unterschied im Alltag.' }),
        textareaField('mostUrgentGoal', 'Was ist jetzt am dringendsten?', { required: true, wide: true, placeholder: 'Was sollte zuerst geklärt oder verbessert werden?' }),
        textareaField('goalTwoWeeks', 'Was soll in den nächsten 2 Wochen erreicht werden?', { wide: true, placeholder: 'Zum Beispiel ein Antrag, ein Termin oder eine spürbare Entlastung.', askInQuickFlow: false }),
        textareaField('goalThreeMonths', 'Was soll in den nächsten 3 Monaten erreicht werden?', { wide: true, placeholder: 'Zum Beispiel eine stabile Versorgung oder ein geklärter Pflegegrad.', askInQuickFlow: false }),
        checkboxField('goalFocus', 'Worum geht es vor allem?', ['Entlastung der Angehörigen', 'Pflegegrad', 'Sichere Versorgung zuhause', 'Mehr Selbstständigkeit', 'Weniger Überforderung', 'Bessere Struktur', 'Hilfsmittel', 'Reha', 'Behörden oder Unterlagen'], { wide: true, askInQuickFlow: false }),
        textareaField('familyGoal', 'Was wäre für die Familie ein gutes Ergebnis?', { required: true, wide: true }),
      ],
    },
    {
      title: 'Eigene Schilderung',
      intro: 'Hier kann die Situation noch einmal frei in eigenen Worten beschrieben werden.',
      fields: [
        textareaField('situationNarrative', 'Wie beschreibt die betroffene Person oder Familie die aktuelle Situation in eigenen Worten?', { required: true, wide: true, rows: 6, placeholder: 'Was ist passiert, was belastet im Alltag am meisten und warum wird gerade jetzt Hilfe gebraucht?' }),
        textareaField('wishNarrative', 'Was wünscht sich die betroffene Person oder Familie konkret?', { required: true, wide: true, rows: 5, placeholder: 'Was soll sich verbessern, was wäre eine gute Lösung und was wäre kurzfristig schon hilfreich?' }),
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

  const ALL_QUESTIONS = SECTIONS.flatMap((section, sectionIndex) =>
    section.fields.map((field, fieldIndex) => ({
      ...field,
      sectionTitle: section.title,
      sectionIntro: section.intro,
      sectionIndex,
      fieldIndex,
    }))
  );

  const FIELD_HELP_TEXTS = {
    firstName: 'Bitte tragen Sie die Daten der betroffenen Person ein, nicht die der ausfüllenden Person.',
    birthDate: 'Das Geburtsdatum hilft, die Situation besser einzuordnen und später Unterlagen korrekt zuzuordnen.',
    insuranceProvider: 'Falls bekannt, nennen Sie die Kranken- oder Pflegekasse, damit spätere Anträge richtig zugeordnet werden können.',
    hasCareLevel: 'Falls schon ein Pflegegrad vorliegt, kann die Planung gezielter auf vorhandene Leistungen aufbauen.',
    filledByRole: 'Damit später klar ist, aus welcher Perspektive die Angaben gemacht wurden.',
    filledByContact: 'Bitte mit Name, Beziehung zur betroffenen Person und möglichst Telefon oder E-Mail.',
    requestReason: 'Wählen Sie den Hauptanlass, der die Versorgungsplanung gerade notwendig macht.',
    mainProblem: 'Beschreiben Sie das Hauptproblem möglichst konkret: Was klappt nicht, wo entsteht Druck oder Überforderung?',
    situationSince: 'Eine grobe zeitliche Einordnung reicht. Es geht nicht um ein exaktes Datum.',
    recentlyWorsened: 'Wählen Sie Ja, wenn sich die Lage in letzter Zeit sichtbar verschlechtert hat.',
    mainDiagnoses: 'Mehrfachauswahl ist möglich. Es geht um die Themen, die den Alltag aktuell am stärksten prägen.',
    mainDiagnosesDetails: 'Hier können Sie ergänzen, was in den Auswahlfeldern fehlt oder genauer benannt werden soll.',
    dailyLimitations: 'Kurz und konkret reicht: Wo im Alltag entstehen regelmäßig Probleme oder Abhängigkeiten?',
    currentGaps: 'Hier geht es um das, was derzeit fehlt, obwohl es eigentlich gebraucht würde.',
    availableDocuments: 'Nennen Sie zum Beispiel Bescheide, Arztbriefe, Gutachten, Anträge oder Entlassungsberichte.',
    livingSituation: 'Beschreiben Sie kurz das Wohn- und Lebensumfeld, weil das die Planung stark beeinflusst.',
    familyGoal: 'Was wäre aus Sicht der Familie oder der betroffenen Person ein wirklich gutes Ergebnis?',
    situationNarrative: 'Hier darf frei geschrieben werden. Genau dieser Text wird später mit KI verständlich zusammengefasst.',
    wishNarrative: 'Beschreiben Sie hier das gewünschte Zielbild möglichst konkret und alltagsnah.',
    supportingDocuments: 'Laden Sie nur Unterlagen hoch, die für die aktuelle Versorgung oder die Antragslage wirklich relevant sind.',
  };

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

  function isFieldMissing(field, draft, files) {
    if (!field.required) return false;
    if (field.type === 'file') return files.length === 0;
    const value = draft[field.id];
    return Array.isArray(value) ? value.length === 0 : !String(value || '').trim();
  }

  function getRequiredMissingForSection(section, draft, files) {
    return section.fields.filter((field) => isQuestionVisible(field, draft, false, true) && isFieldMissing(field, draft, files));
  }

  function isQuestionVisible(question, draft, includeOptionalDetails, ignoreQuickFlow) {
    if (typeof question.showWhen === 'function' && !question.showWhen(draft)) {
      return false;
    }
    if (ignoreQuickFlow) {
      return true;
    }
    return question.required || question.askInQuickFlow !== false || includeOptionalDetails;
  }

  function getActiveQuestions(state) {
    const visibleQuestions = ALL_QUESTIONS.filter((question) => isQuestionVisible(question, state.draft, state.includeOptionalDetails, false));
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
    const index = questions.findIndex((question) => isFieldMissing(question, state.draft, state.draftFiles));
    return index >= 0 ? index : Math.max(questions.length - 1, 0);
  }

  function getHiddenOptionalQuestionCount(state) {
    return ALL_QUESTIONS.filter((question) => !question.required && question.askInQuickFlow === false && isQuestionVisible(question, state.draft, true, false)).length;
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

  function renderField(field, draft, files) {
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

    if (field.type === 'file') {
      return `
        <div class="${fieldClass}">
          ${renderFieldLabel(field, field.id)}
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
        ${renderFieldLabel(field, field.id)}
        <input id="${escapeHtml(field.id)}" type="${escapeHtml(inputType)}" name="${escapeHtml(field.id)}" value="${escapeHtml(value || '')}" placeholder="${escapeHtml(field.placeholder || '')}">
      </div>
    `;
  }

  function getAllMissingRequired(state) {
    return SECTIONS.flatMap((section) => getRequiredMissingForSection(section, state.draft, state.draftFiles).map((field) => field.label));
  }

  function renderReview(state) {
    const draft = state.draft;
    const missingFields = Array.from(new Set(getAllMissingRequired(state)));
    const reviewGroups = [
      ['Person', `${draft.firstName || ''} ${draft.lastName || ''}`.trim(), draft.email || '', draft.phone || ''],
      ['Kernlage', draft.mainProblem || '', draft.dailyLimitations || '', draft.currentGaps || ''],
      ['Aktueller Stand', draft.currentHelpers || '', draft.availableDocuments || '', draft.familyGoal || ''],
      ['Eigene Schilderung', draft.situationNarrative || '', draft.wishNarrative || ''],
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
          <h3>Letzter Check vor dem Abschluss</h3>
          <p>${missingFields.length ? 'Es fehlen noch einige Pflichtangaben. Ergänzen Sie diese bitte vor dem Abschluss.' : 'Alle Pflichtangaben sind vorhanden. Sie können den Vorgang jetzt abschließen.'}</p>
        </div>
        ${missingFields.length ? `<div class="planning-validation-list"><strong>Fehlt noch:</strong><ul>${missingFields.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
      </div>
      <div class="planning-payment-box">
        <div>
          <span class="planning-payment-price">Bereit zum Abschluss</span>
          <p>Mit dem Abschluss werden Ihre Angaben final erfasst und übersichtlich an Sie übermittelt.</p>
        </div>
        <div class="planning-payment-actions">
          <button class="btn primary" type="button" data-action="checkout" ${missingFields.length ? 'disabled' : ''}>Jetzt abschließen</button>
        </div>
      </div>
    `;
  }

  function renderQuestionShell(state, question, questions) {
    const progressValue = Math.max(4, Math.round(((state.currentStep + 1) / (questions.length + 1)) * 100));
    const currentSection = SECTIONS[question.sectionIndex];
    const currentMissing = isFieldMissing(question, state.draft, state.draftFiles);
    const visibleSections = getVisibleSections(state);
    const hiddenOptionalCount = getHiddenOptionalQuestionCount(state);

    return `
      <div class="planning-app-frame">
        <div class="planning-app-status">
          <div>
            <span class="planning-eyebrow">Frage ${state.currentStep + 1} von ${questions.length}</span>
            <strong class="planning-app-title">${escapeHtml(question.sectionTitle)}</strong>
          </div>
          <div class="planning-app-actions-top">
            ${hiddenOptionalCount && !state.includeOptionalDetails ? `<button class="planning-mini-action" type="button" data-action="enable-details"><i class="fa-solid fa-sliders"></i> ${hiddenOptionalCount} Detailfragen einblenden</button>` : ''}
            <span class="planning-save-indicator"><i class="fa-solid fa-cloud-arrow-up"></i> Automatisch gespeichert</span>
          </div>
        </div>
        <div class="planning-progress-bar" aria-hidden="true">
          <span class="planning-progress-bar-fill" style="width:${progressValue}%"></span>
        </div>
        <div class="planning-section-strip" aria-hidden="true">
          ${visibleSections.map(({ section, index }, visibleIndex) => {
            const isActive = index === question.sectionIndex;
            const isComplete = index < question.sectionIndex || getRequiredMissingForSection(section, state.draft, state.draftFiles).length === 0;
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
          ${renderField(question, state.draft, state.draftFiles)}
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
                  <strong class="planning-app-title">Vollständigkeit prüfen und abschließen</strong>
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
                  <h2>Angaben prüfen und abschließen</h2>
                  <p>Hier sehen Sie die wichtigsten Angaben gesammelt. Wenn alles passt, können Sie den Vorgang jetzt abschließen.</p>
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
    if (!field || field.type === 'file') return nextDraft;
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
    rerender();
  }

  async function startCheckout(state) {
    if (getAllMissingRequired(state).length > 0) {
      alert('Bitte füllen Sie zuerst alle Pflichtangaben aus.');
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
      checkoutButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Abschluss wird vorbereitet';
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
      };
      saveOrders(orders);
      await saveFilesForKey(data.orderRef, state.draftFiles);

      window.location.href = data.checkoutUrl;
    } catch (error) {
      alert('Der Abschluss konnte gerade nicht gestartet werden. Bitte versuchen Sie es erneut.');
      if (checkoutButton) {
        checkoutButton.disabled = false;
        checkoutButton.innerHTML = 'Jetzt abschließen';
      }
    }
  }

  async function initPlanningApp(root) {
    const state = {
      currentStep: 0,
      draft: loadJson(DRAFT_STORAGE_KEY, {}),
      draftFiles: [],
      showValidation: false,
      includeOptionalDetails: false,
      autoAdvanceTimer: null,
    };

    try {
      state.draftFiles = await getFilesForKey('draft');
    } catch {
      state.draftFiles = [];
    }

    const rerender = () => {
      renderApp(root, state);
      const preferredFocus = root.querySelector('textarea, select, input[type="text"], input[type="email"], input[type="tel"], input[type="date"], input[type="file"]');
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
        if (!currentQuestion || isFieldMissing(currentQuestion, state.draft, state.draftFiles)) {
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
        if (currentQuestion && isFieldMissing(currentQuestion, state.draft, state.draftFiles)) {
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

      if (action === 'enable-details') {
        state.includeOptionalDetails = true;
        state.currentStep = getFirstIncompleteQuestionIndex(state);
        state.showValidation = false;
        rerender();
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

      const questions = getActiveQuestions(state);
      if (state.currentStep < questions.length) {
        state.draft = collectFieldValue(root, questions[state.currentStep], state.draft);
        saveJson(DRAFT_STORAGE_KEY, state.draft);
        state.showValidation = false;
        if (target.matches('input[type="radio"], input[type="checkbox"], select')) {
          rerender();
        }
        const currentQuestion = getActiveQuestions(state)[state.currentStep];
        if (canAutoAdvance(currentQuestion) && !isFieldMissing(currentQuestion, state.draft, state.draftFiles)) {
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

  async function processNarrativeText(order) {
    const response = await fetch('/api/planning/process-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        situationText: order.draft.situationNarrative,
        wishText: order.draft.wishNarrative,
        context: {
          mainProblem: order.draft.mainProblem,
          currentGaps: order.draft.currentGaps,
          familyGoal: order.draft.familyGoal,
        },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
      return {
        processedSummary: order.draft.situationNarrative || '',
        actionFocus: order.draft.wishNarrative || '',
        source: 'local-fallback',
      };
    }

    return data;
  }

  function buildEmailMessage(orderRef, order, paymentStatus) {
    const applicantName = `${order.draft.firstName || ''} ${order.draft.lastName || ''}`.trim();
    const sectionLines = SECTIONS.map((section) => {
      const entries = section.fields
        .filter((field) => field.type !== 'file')
        .map((field) => {
          const value = formatValue(field, order.draft[field.id]);
          return value ? `${field.label}: ${value}` : '';
        })
        .filter(Boolean);

      if (section.title === 'Dokumente' && (order.files || []).length) {
        entries.push(`Ausgewaehlte Dokumente: ${(order.files || []).map((file) => file.name).join(', ')}`);
      }

      return entries.length ? [`${section.title}:`, ...entries, ''] : [];
    }).flat();

    const lines = [
      'Neue abgeschlossene Versorgungsplanung',
      '',
      `Vorgangsnummer: ${orderRef}`,
      `Name: ${applicantName}`,
      `E-Mail: ${order.draft.email || paymentStatus.customerEmail || ''}`,
      `Telefon: ${order.draft.phone || ''}`,
      `Status: ${paymentStatus.status}`,
      '',
      'Kurzzusammenfassung:',
      `Grund der Anfrage: ${order.draft.requestReason || ''}`,
      `Hauptproblem: ${order.draft.mainProblem || ''}`,
      `Versorgungsluecken: ${order.draft.currentGaps || ''}`,
      `Ziel der Familie: ${order.draft.familyGoal || ''}`,
      '',
      'KI-Strukturierung:',
      `Zusammenfassung: ${order.aiProcessing?.processedSummary || ''}`,
      `Fokus: ${order.aiProcessing?.actionFocus || ''}`,
      '',
      ...sectionLines,
    ];

    return lines.join('\n');
  }

  async function sendPlanningOrder(orderRef, order, paymentStatus) {
    const applicantName = `${order.draft.firstName || ''} ${order.draft.lastName || ''}`.trim() || paymentStatus.applicantName || 'Versorgungsplanung';
    const formData = new FormData();

    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', `Abgeschlossene Versorgungsplanung | ${applicantName} | ${orderRef}`);
    formData.append('from_name', 'casekompass.de Versorgungsplanung');
    formData.append('name', applicantName);
    formData.append('email', order.draft.email || paymentStatus.customerEmail || 'casekompass@gmx.de');
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
        <p>Für diesen Vorgang fehlt der Token. Bitte starten Sie die Versorgungsplanung erneut über das Formular.</p>
        <div class="shop-status-actions">
          <a class="btn primary" href="versorgungsplanung-starten.html"><i class="fa-solid fa-arrow-left"></i> Zum Formular</a>
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
          <h2>Abschluss noch nicht bestaetigt</h2>
          <p>Der aktuelle Status ist <strong>${escapeHtml(paymentStatus.status)}</strong>. Sobald der Vorgang bestaetigt ist, werden Ihre Angaben automatisch erfasst.</p>
          <div class="shop-status-actions">
            <a class="btn primary" href="versorgungsplanung-starten.html"><i class="fa-solid fa-rotate-right"></i> Zurück zum Formular</a>
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
          <h2>Daten bereits erfasst</h2>
          <p>Ihre Angaben wurden bereits erfolgreich erfasst. Ihr individueller Versorgungsplan wird innerhalb von 1 bis 3 Werktagen fuer Sie erstellt.</p>
          <div class="shop-status-actions">
            <a class="btn ghost" href="versorgungsplanung-starten.html"><i class="fa-solid fa-arrow-left"></i> Zurück zum Formular</a>
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
            <a class="btn ghost" href="versorgungsplanung-starten.html"><i class="fa-solid fa-arrow-left"></i> Zurück</a>
          </div>
        `;
        return;
      }

      order.files = await getFilesForKey(paymentStatus.orderRef);
      order.aiProcessing = await processNarrativeText(order);
      await sendPlanningOrder(paymentStatus.orderRef, order, paymentStatus);

      dispatched[paymentStatus.orderRef] = {
        sentAt: new Date().toISOString(),
      };
      saveDispatchedOrders(dispatched);
      saveJson(DRAFT_STORAGE_KEY, {});
      await clearFilesForKey('draft');

      root.classList.add('is-success');
      root.innerHTML = `
        <div class="shop-status-icon"><i class="fa-solid fa-paper-plane"></i></div>
        <h2>Daten erfolgreich erfasst</h2>
        <p>Ihre Daten wurden erfasst. Ihr individueller Versorgungsplan wird innerhalb von 1 bis 3 Werktagen fuer Sie erstellt.</p>
        <div class="shop-status-actions">
          <a class="btn ghost" href="versorgungsplanung-starten.html"><i class="fa-solid fa-arrow-left"></i> Zurück zum Formular</a>
          <a class="btn ghost" href="kontakt.html"><i class="fa-regular fa-envelope"></i> Kontakt</a>
        </div>
      `;
    } catch (error) {
      root.classList.add('is-warning');
      root.innerHTML = `
        <div class="shop-status-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
        <h2>Abschluss konnte nicht automatisch erfasst werden</h2>
        <p>Der Vorgang wurde zwar geprueft, aber die Uebermittlung Ihrer Angaben ist gerade fehlgeschlagen. Bitte laden Sie die Seite erneut oder melden Sie sich direkt.</p>
        <div class="shop-status-actions">
          <a class="btn primary" href="versorgungsplanung-starten.html"><i class="fa-solid fa-arrow-left"></i> Zurück zum Formular</a>
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