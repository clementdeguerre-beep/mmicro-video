/* =====================================================================
   MMICRO Multiservices — scripts du site
   Pour changer un texte, modifiez index.html : rien à toucher ici.
   ===================================================================== */
(function () {
  'use strict';

  var ENDPOINT = 'https://api.web3forms.com/submit';
  var TEL_LIEN = 'tel:+33646485564';
  var TEL_AFFICHE = '06 46 48 55 64';
  var reduireAnimations = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- En-tête : trait discret dès que l'on fait défiler ---------- */
  var entete = document.getElementById('entete');
  function majEntete() {
    if (entete) entete.classList.toggle('est-defile', window.scrollY > 8);
  }
  window.addEventListener('scroll', majEntete, { passive: true });
  majEntete();

  /* ---------- Menu mobile ---------- */
  var boutonMenu = document.querySelector('.bouton-menu');
  var menu = document.getElementById('menu-mobile');
  function fermerMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    boutonMenu.setAttribute('aria-expanded', 'false');
    boutonMenu.setAttribute('aria-label', 'Ouvrir le menu');
  }
  if (boutonMenu && menu) {
    boutonMenu.addEventListener('click', function () {
      var ouvrir = menu.hidden;
      menu.hidden = !ouvrir;
      boutonMenu.setAttribute('aria-expanded', String(ouvrir));
      boutonMenu.setAttribute('aria-label', ouvrir ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) fermerMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { fermerMenu(); boutonMenu.focus(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080) fermerMenu();
    });
  }

  /* ---------- Barre d'appel mobile ----------
     Masquée tant que les boutons de l'accroche ou le formulaire sont à l'écran,
     pour ne jamais afficher deux fois les mêmes boutons. */
  var barre = document.getElementById('barre-mobile');
  if (barre && 'IntersectionObserver' in window) {
    var cibles = [document.querySelector('.hero__actions'), document.getElementById('rappel')].filter(Boolean);
    var aLEcran = [];
    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        var i = aLEcran.indexOf(e.target);
        if (e.isIntersecting && i === -1) aLEcran.push(e.target);
        if (!e.isIntersecting && i !== -1) aLEcran.splice(i, 1);
      });
      barre.classList.toggle('est-masquee', aLEcran.length > 0);
    }, { threshold: 0.08 });
    cibles.forEach(function (c) { observateur.observe(c); });
  }

  /* ---------- Année du pied de page ---------- */
  document.querySelectorAll('[data-annee]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Formulaire de demande de rappel ---------- */
  var form = document.getElementById('form-rappel');
  if (!form) return;

  var debut = Date.now();
  var statut = document.getElementById('statut');
  var succes = document.getElementById('succes');
  var boutonEnvoyer = document.getElementById('envoyer');
  function champ(id) { return document.getElementById(id); }

  function normaliserTel(valeur) {
    var n = String(valeur || '').replace(/\(0\)/g, '').replace(/[\s.\-()]/g, '');
    if (n.indexOf('+33') === 0) n = '0' + n.slice(3);
    else if (n.indexOf('0033') === 0) n = '0' + n.slice(4);
    if (!/^0[1-9]\d{8}$/.test(n)) return null;
    return n.replace(/(\d{2})(?=\d)/g, '$1 ');
  }

  var regles = {
    prenom: { test: function (v) { return v.trim().length >= 1; }, message: 'Indiquez votre prénom.' },
    nom: { test: function (v) { return v.trim().length >= 1; }, message: 'Indiquez votre nom.' },
    telephone: {
      test: function (v) { return normaliserTel(v) !== null; },
      message: 'Indiquez un numéro de téléphone français, par exemple 06 12 34 56 78.'
    },
    email: {
      test: function (v) { v = v.trim(); return v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); },
      message: 'Cette adresse e-mail semble incomplète. Exemple : nom@exemple.fr'
    },
    commune: { test: function (v) { return v.trim().length >= 2; }, message: 'Indiquez votre commune ou votre code postal.' },
    description: {
      test: function (v) { return v.trim().length >= 10; },
      message: 'Décrivez votre problème en quelques mots (10 caractères au minimum).'
    }
  };

  function marquer(element, idErreur, message) {
    var p = champ(idErreur);
    if (message) {
      element.setAttribute('aria-invalid', 'true');
      p.textContent = message;
      p.hidden = false;
    } else {
      element.removeAttribute('aria-invalid');
      p.textContent = '';
      p.hidden = true;
    }
  }

  function validerChamp(id) {
    var el = champ(id);
    var ok = regles[id].test(el.value);
    marquer(el, id + '-erreur', ok ? '' : regles[id].message);
    return ok;
  }

  function valeurRadio(nom) {
    var coche = form.querySelector('input[name="' + nom + '"]:checked');
    return coche ? coche.value : '';
  }

  function validerBesoin() {
    var ok = valeurRadio('besoin') !== '';
    marquer(champ('groupe-besoin'), 'besoin-erreur', ok ? '' : 'Choisissez le type de besoin.');
    return ok;
  }

  function validerConsentement() {
    var el = champ('consentement');
    marquer(el, 'consentement-erreur', el.checked ? '' : 'Cochez cette case pour que nous puissions vous recontacter.');
    return el.checked;
  }

  /* Renvoie le premier élément à corriger, ou null si tout est bon */
  function valider() {
    var premier = null;
    ['prenom', 'nom', 'telephone', 'email', 'commune'].forEach(function (id) {
      if (!validerChamp(id) && !premier) premier = champ(id);
    });
    if (!validerBesoin() && !premier) premier = form.querySelector('input[name="besoin"]');
    if (!validerChamp('description') && !premier) premier = champ('description');
    if (!validerConsentement() && !premier) premier = champ('consentement');
    return premier;
  }

  /* Correction en direct : l'erreur disparaît dès que le champ est bon */
  Object.keys(regles).forEach(function (id) {
    var el = champ(id);
    el.addEventListener('input', function () {
      if (el.getAttribute('aria-invalid') === 'true') validerChamp(id);
    });
    el.addEventListener('blur', function () {
      if (el.value.trim() !== '' || el.getAttribute('aria-invalid') === 'true') validerChamp(id);
    });
  });
  champ('telephone').addEventListener('blur', function () {
    var formate = normaliserTel(this.value);
    if (formate) this.value = formate;
  });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'besoin' && champ('groupe-besoin').getAttribute('aria-invalid') === 'true') validerBesoin();
    if (e.target.id === 'consentement' && e.target.getAttribute('aria-invalid') === 'true') validerConsentement();
  });

  function collecter() {
    return {
      prenom: champ('prenom').value.trim(),
      nom: champ('nom').value.trim(),
      tel: normaliserTel(champ('telephone').value),
      email: champ('email').value.trim(),
      commune: champ('commune').value.trim(),
      besoin: valeurRadio('besoin'),
      urgence: valeurRadio('urgence') || 'Non précisée',
      creneau: valeurRadio('creneau') || 'Indifférent',
      description: champ('description').value.trim()
    };
  }

  var creneaux = { 'Matin': 'le matin', 'Midi': 'le midi', 'Après-midi': "l'après-midi", 'Soir': 'le soir' };

  function montrerSucces(d, demo) {
    var texte = 'Merci ' + d.prenom + ', nous vous rappelons au ' + d.tel + ' sous 24 h ouvrées';
    if (creneaux[d.creneau]) texte += ', de préférence ' + creneaux[d.creneau];
    champ('succes-texte').textContent = texte + '.';
    champ('succes-demo').hidden = !demo;
    form.hidden = true;
    succes.hidden = false;
    succes.focus({ preventScroll: true });
    succes.scrollIntoView({ behavior: reduireAnimations ? 'auto' : 'smooth', block: 'center' });
  }

  function montrerErreurEnvoi() {
    statut.textContent = '';
    statut.append("L'envoi n'a pas abouti. Vérifiez votre connexion et réessayez, ou appelez-nous au ");
    var lien = document.createElement('a');
    lien.href = TEL_LIEN;
    lien.textContent = TEL_AFFICHE;
    statut.append(lien, '.');
  }

  function envoyer(cle, d) {
    var donnees = {
      access_key: cle,
      subject: 'Nouvelle demande de rappel – ' + d.besoin + ' – ' + d.commune,
      from_name: 'Site MMICRO Multiservices',
      'Prénom': d.prenom,
      'Nom': d.nom,
      'Téléphone': d.tel
    };
    /* Le champ « email » devient automatiquement l'adresse de réponse */
    if (d.email) donnees.email = d.email;
    donnees['Commune'] = d.commune;
    donnees['Type de besoin'] = d.besoin;
    donnees['Urgence'] = d.urgence;
    donnees['Créneau de rappel'] = d.creneau;
    donnees['Description'] = d.description;
    donnees['Consentement'] = 'Oui, le ' + new Date().toLocaleString('fr-FR');

    var libelle = boutonEnvoyer.textContent;
    boutonEnvoyer.disabled = true;
    boutonEnvoyer.textContent = 'Envoi en cours…';

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(donnees)
    })
      .then(function (reponse) {
        return reponse.json().then(function (json) { return { ok: reponse.ok, json: json }; });
      })
      .then(function (r) {
        if (r.ok && r.json && r.json.success) montrerSucces(d, false);
        else montrerErreurEnvoi();
      })
      .catch(montrerErreurEnvoi)
      .then(function () {
        boutonEnvoyer.disabled = false;
        boutonEnvoyer.textContent = libelle;
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statut.textContent = '';

    var aCorriger = valider();
    if (aCorriger) { aCorriger.focus(); return; }

    var d = collecter();

    /* Anti-spam : case piège cochée ou formulaire rempli en moins d'une seconde et demie */
    if (champ('botcheck').checked || Date.now() - debut < 1500) { montrerSucces(d, false); return; }

    var cle = champ('cle-web3forms').value.trim();
    var demo = cle === '' || cle.indexOf('VOTRE_') === 0;
    if (demo) { montrerSucces(d, true); return; }

    envoyer(cle, d);
  });

  champ('nouvelle-demande').addEventListener('click', function () {
    form.reset();
    ['prenom', 'nom', 'telephone', 'email', 'commune', 'description'].forEach(function (id) {
      marquer(champ(id), id + '-erreur', '');
    });
    marquer(champ('groupe-besoin'), 'besoin-erreur', '');
    marquer(champ('consentement'), 'consentement-erreur', '');
    statut.textContent = '';
    succes.hidden = true;
    form.hidden = false;
    debut = Date.now();
    champ('prenom').focus();
  });
})();
