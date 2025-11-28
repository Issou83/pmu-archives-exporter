/**
 * Contenu des documents légaux pour affichage dans l'interface
 */

export const DISCLAIMER_CONTENT = (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">⚠️ AVERTISSEMENT ET DISCLAIMER</h2>
      <p className="text-sm text-gray-500 mb-6">Date de dernière mise à jour : 28 Novembre 2025</p>
    </div>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">📋 AVERTISSEMENT IMPORTANT</h3>
      <p className="text-gray-700 mb-4">
        Ce projet <strong>PMU Archives Exporter</strong> est un outil éducatif et de recherche permettant d'extraire et d'exporter des archives de réunions PMU depuis le site turf-fr.com.
      </p>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <p className="text-yellow-800 font-semibold">⚠️ UTILISATION À VOS PROPRES RISQUES</p>
        <p className="text-yellow-700 text-sm mt-2">
          L'utilisation de ce projet se fait à vos propres risques. Les développeurs et contributeurs de ce projet ne peuvent être tenus responsables de toute utilisation non conforme aux lois et réglementations en vigueur.
        </p>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">📊 SOURCE DES DONNÉES</h3>
      <p className="text-gray-700 mb-2">Les données extraites proviennent de <strong>turf-fr.com</strong> et sont utilisées conformément aux règles suivantes :</p>
      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
        <li>✅ <strong>Respect de robots.txt</strong> : Le projet respecte automatiquement le fichier robots.txt de turf-fr.com</li>
        <li>✅ <strong>User-Agent transparent</strong> : Le projet s'identifie clairement lors des requêtes</li>
        <li>✅ <strong>Délais respectueux</strong> : Le projet respecte les délais recommandés entre les requêtes</li>
        <li>✅ <strong>Données publiques uniquement</strong> : Seules les données publiquement accessibles sont extraites</li>
      </ul>
      <p className="text-gray-600 italic text-sm">
        <strong>Ce projet n'est pas affilié à, ni approuvé par turf-fr.com ou la PMU.</strong>
      </p>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">⚖️ RESPONSABILITÉ LÉGALE</h3>
      <h4 className="text-lg font-semibold text-gray-700 mb-2">Limitation de responsabilité</h4>
      <p className="text-gray-700 mb-3">Les développeurs de ce projet déclinent toute responsabilité concernant :</p>
      <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4">
        <li><strong>L'exactitude des données</strong> : Les données sont extraites telles qu'elles apparaissent sur le site source.</li>
        <li><strong>L'utilisation des données</strong> : L'utilisateur est seul responsable de l'utilisation qu'il fait des données extraites.</li>
        <li><strong>Les dommages causés</strong> : Aucune responsabilité ne peut être engagée pour les dommages directs ou indirects.</li>
        <li><strong>La conformité légale</strong> : L'utilisateur est responsable de s'assurer que son utilisation est conforme aux lois.</li>
      </ol>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">🚫 UTILISATIONS INTERDITES</h3>
      <p className="text-gray-700 mb-2">L'utilisation de ce projet est <strong>STRICTEMENT INTERDITE</strong> pour :</p>
      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
        <li>Toute activité commerciale sans autorisation explicite du propriétaire des données</li>
        <li>Toute violation des droits de propriété intellectuelle</li>
        <li>Toute collecte de données personnelles sans consentement</li>
        <li>Toute activité illégale ou contraire aux bonnes mœurs</li>
        <li>Toute surcharge des serveurs des sites sources</li>
        <li>Toute reproduction des données à des fins de concurrence déloyale</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">📝 RECOMMANDATIONS</h3>
      <p className="text-gray-700 mb-2">Avant d'utiliser ce projet, il est <strong>FORTEMENT RECOMMANDÉ</strong> de :</p>
      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
        <li>✅ Lire et comprendre les conditions générales d'utilisation de turf-fr.com</li>
        <li>✅ Consulter un avocat spécialisé en droit du numérique</li>
        <li>✅ Vérifier la conformité de votre utilisation avec les lois en vigueur</li>
        <li>✅ Obtenir les autorisations nécessaires si vous prévoyez une utilisation commerciale</li>
        <li>✅ Respecter les droits de propriété intellectuelle et les droits des bases de données</li>
      </ul>
    </section>

    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
      <p className="text-blue-800 font-semibold mb-2">En utilisant ce projet, vous reconnaissez avoir lu, compris et accepté cet avertissement et ce disclaimer.</p>
    </div>
  </div>
);

export const CGU_CONTENT = (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">📜 CONDITIONS GÉNÉRALES D'UTILISATION</h2>
      <p className="text-sm text-gray-500 mb-6">Date de dernière mise à jour : 28 Novembre 2025</p>
    </div>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">1. OBJET</h3>
      <p className="text-gray-700">
        Les présentes Conditions Générales d'Utilisation (ci-après "CGU") ont pour objet de définir les conditions d'accès et d'utilisation du service <strong>PMU Archives Exporter</strong> (ci-après "le Service").
      </p>
      <p className="text-gray-700 mt-2">
        L'utilisation du Service implique l'acceptation pleine et entière des présentes CGU.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">2. ACCÈS AU SERVICE</h3>
      <h4 className="text-lg font-semibold text-gray-700 mb-2">2.1. Disponibilité</h4>
      <p className="text-gray-700 mb-3">
        Le Service est fourni "en l'état", sans garantie d'aucune sorte. Les développeurs se réservent le droit de modifier, suspendre ou interrompre le Service à tout moment.
      </p>
      <h4 className="text-lg font-semibold text-gray-700 mb-2">2.2. Conditions d'accès</h4>
      <p className="text-gray-700">
        L'accès au Service est gratuit et ouvert à tous, sous réserve de respecter les présentes CGU et les lois en vigueur.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">3. UTILISATION DU SERVICE</h3>
      <h4 className="text-lg font-semibold text-gray-700 mb-2">3.1. Utilisation autorisée</h4>
      <p className="text-gray-700 mb-2">Le Service peut être utilisé pour :</p>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
        <li>✅ Recherche et analyse personnelle</li>
        <li>✅ Projets éducatifs et académiques</li>
        <li>✅ Extraction de données à des fins de recherche (non commerciale)</li>
      </ul>
      <h4 className="text-lg font-semibold text-gray-700 mb-2">3.2. Utilisation interdite</h4>
      <p className="text-gray-700 mb-2">Il est <strong>STRICTEMENT INTERDIT</strong> d'utiliser le Service pour :</p>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
        <li>❌ Toute activité commerciale sans autorisation</li>
        <li>❌ Toute violation des droits de propriété intellectuelle</li>
        <li>❌ Toute collecte de données personnelles sans consentement</li>
        <li>❌ Toute activité illégale ou contraire aux bonnes mœurs</li>
        <li>❌ Toute surcharge des serveurs des sites sources</li>
        <li>❌ Toute reproduction des données à des fins de concurrence déloyale</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">4. DONNÉES ET CONTENU</h3>
      <p className="text-gray-700 mb-2">
        Les données extraites proviennent de <strong>turf-fr.com</strong> et sont utilisées conformément aux règles suivantes :
      </p>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
        <li>✅ Respect automatique du fichier robots.txt</li>
        <li>✅ User-Agent transparent et identifiable</li>
        <li>✅ Délais respectueux entre les requêtes</li>
        <li>✅ Extraction uniquement de données publiquement accessibles</li>
      </ul>
      <p className="text-gray-700 mb-2">
        <strong>Les données extraites restent la propriété de leurs propriétaires respectifs.</strong> Ce Service ne revendique aucun droit de propriété sur ces données.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">5. RESPONSABILITÉ</h3>
      <p className="text-gray-700 mb-2">
        Les développeurs du Service déclinent toute responsabilité concernant les dommages directs ou indirects résultant de l'utilisation du Service.
      </p>
      <p className="text-gray-700">
        L'utilisateur est seul responsable de l'utilisation qu'il fait du Service et de la conformité de son utilisation avec les lois en vigueur.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">6. PROTECTION DES DONNÉES PERSONNELLES</h3>
      <p className="text-gray-700 mb-2">
        Le Service ne collecte <strong>AUCUNE donnée personnelle</strong> identifiable. Pour plus d'informations, consultez notre <a href="#" className="text-indigo-600 hover:underline">Politique de Confidentialité</a>.
      </p>
    </section>

    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
      <p className="text-blue-800 font-semibold">
        En utilisant le Service, vous reconnaissez avoir lu, compris et accepté les présentes Conditions Générales d'Utilisation.
      </p>
    </div>
  </div>
);

export const PRIVACY_CONTENT = (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🔒 POLITIQUE DE CONFIDENTIALITÉ</h2>
      <p className="text-sm text-gray-500 mb-6">Date de dernière mise à jour : 28 Novembre 2025</p>
    </div>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">1. INTRODUCTION</h3>
      <p className="text-gray-700 mb-2">
        Cette Politique de Confidentialité décrit comment le projet <strong>PMU Archives Exporter</strong> collecte, utilise et protège vos informations.
      </p>
      <p className="text-gray-700">
        <strong>Conformité RGPD</strong> : Cette politique est conforme au Règlement Général sur la Protection des Données (RGPD) et à la Loi Informatique et Libertés.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">2. COLLECTE DE DONNÉES</h3>
      <h4 className="text-lg font-semibold text-gray-700 mb-2">2.1. Aucune collecte de données personnelles</h4>
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
        <p className="text-green-800 font-semibold">
          Le Service <strong>NE COLLECTE AUCUNE DONNÉE PERSONNELLE</strong> identifiable.
        </p>
        <p className="text-green-700 text-sm mt-2">
          Aucune information permettant d'identifier directement ou indirectement une personne physique n'est collectée, stockée ou traitée.
        </p>
      </div>
      <h4 className="text-lg font-semibold text-gray-700 mb-2">2.2. Données techniques collectées</h4>
      <p className="text-gray-700 mb-2">Les seules données techniques collectées sont :</p>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
        <li><strong>Adresses IP</strong> : Anonymisées (dernier octet masqué), conservation max 30 jours</li>
        <li><strong>Logs d'accès</strong> : Date, heure, URL, code statut (sans données personnelles), conservation max 90 jours</li>
        <li><strong>Statistiques</strong> : Agrégées et anonymisées, conservation indéfinie</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">3. UTILISATION DES DONNÉES</h3>
      <p className="text-gray-700 mb-2">Les données techniques collectées sont utilisées uniquement pour :</p>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
        <li>✅ Assurer le bon fonctionnement du Service</li>
        <li>✅ Améliorer les performances et la fiabilité</li>
        <li>✅ Prévenir les abus et les attaques</li>
        <li>✅ Générer des statistiques agrégées et anonymisées</li>
        <li>✅ Respecter les obligations légales</li>
      </ul>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-yellow-800 font-semibold">Les données collectées NE SONT JAMAIS :</p>
        <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm mt-2">
          <li>❌ Vendues à des tiers</li>
          <li>❌ Utilisées à des fins publicitaires</li>
          <li>❌ Partagées avec des partenaires commerciaux</li>
          <li>❌ Utilisées pour créer des profils utilisateurs</li>
        </ul>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">4. VOS DROITS (RGPD)</h3>
      <p className="text-gray-700 mb-2">Conformément au RGPD, vous disposez des droits suivants :</p>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
        <li>Droit d'accès</li>
        <li>Droit de rectification</li>
        <li>Droit à l'effacement</li>
        <li>Droit à la portabilité</li>
        <li>Droit d'opposition</li>
        <li>Droit de limitation</li>
      </ul>
      <p className="text-gray-600 text-sm italic">
        Note : Comme le Service ne collecte aucune donnée personnelle identifiable, ces droits ne sont pas applicables dans la pratique.
      </p>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">5. SÉCURITÉ DES DONNÉES</h3>
      <p className="text-gray-700 mb-2">Le Service met en œuvre des mesures techniques et organisationnelles appropriées :</p>
      <ul className="list-disc list-inside space-y-1 text-gray-700 mb-4">
        <li>✅ Chiffrement des communications (HTTPS)</li>
        <li>✅ Anonymisation des adresses IP</li>
        <li>✅ Accès restreint aux données</li>
        <li>✅ Sauvegardes régulières</li>
        <li>✅ Surveillance des accès</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">6. CONTACT</h3>
      <p className="text-gray-700 mb-2">
        Pour toute question concernant cette Politique de Confidentialité, veuillez consulter un avocat spécialisé en protection des données.
      </p>
      <p className="text-gray-700">
        <strong>CNIL</strong> : https://www.cnil.fr - 01 53 73 22 22
      </p>
    </section>
  </div>
);

export const LEGAL_ANALYSIS_CONTENT = (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">⚖️ ANALYSE JURIDIQUE COMPLÈTE</h2>
      <p className="text-sm text-gray-500 mb-6">Date : 28 Novembre 2025</p>
    </div>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">📊 RÉSUMÉ EXÉCUTIF</h3>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <p className="text-yellow-800 font-semibold mb-2">Niveau de risque global : ⚠️ ÉLEVÉ</p>
        <p className="text-yellow-700 text-sm">
          Le projet présente plusieurs risques juridiques significatifs en France. Bien que le scraping ne soit pas illégal en soi, plusieurs aspects du projet peuvent exposer à des poursuites judiciaires.
        </p>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">🔍 RISQUES IDENTIFIÉS</h3>
      <div className="space-y-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <h4 className="font-semibold text-red-800 mb-2">1. Droit sui generis des bases de données - RISQUE TRÈS ÉLEVÉ</h4>
          <p className="text-red-700 text-sm">
            Les archives PMU constituent probablement une base de données protégée. L'extraction systématique peut être considérée comme une partie substantielle.
          </p>
          <p className="text-red-700 text-sm mt-2">
            <strong>Sanctions possibles :</strong> Jusqu'à 3 ans d'emprisonnement et 300 000 € d'amende.
          </p>
        </div>
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <h4 className="font-semibold text-orange-800 mb-2">2. Conditions générales d'utilisation - RISQUE ÉLEVÉ</h4>
          <p className="text-orange-700 text-sm">
            Aucune interdiction explicite trouvée, mais recommandation de contacter turf-fr.com pour confirmation.
          </p>
        </div>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">3. Concurrence déloyale - RISQUE MOYEN</h4>
          <p className="text-yellow-700 text-sm">
            Si le projet concurrence directement turf-fr.com ou détourne la clientèle.
          </p>
        </div>
      </div>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">✅ MESURES DE PROTECTION IMPLÉMENTÉES</h3>
      <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
        <li>✅ Respect automatique de robots.txt</li>
        <li>✅ User-Agent transparent et identifiable</li>
        <li>✅ Délais respectueux entre les requêtes</li>
        <li>✅ Documents légaux complets (disclaimers, CGU, politique de confidentialité)</li>
        <li>✅ Limitation de responsabilité</li>
      </ul>
    </section>

    <section>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">⚠️ ACTIONS RECOMMANDÉES</h3>
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <p className="text-blue-800 font-semibold mb-2">Actions urgentes :</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
          <li>Contacter turf-fr.com pour obtenir une autorisation écrite</li>
          <li>Consulter un avocat spécialisé en droit du numérique</li>
          <li>Mettre en place les mesures de protection recommandées</li>
        </ol>
      </div>
    </section>

    <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-6">
      <p className="text-red-800 font-semibold mb-2">⚠️ AVERTISSEMENT IMPORTANT</p>
      <p className="text-red-700 text-sm">
        Cette analyse ne constitue pas un conseil juridique professionnel. Il est FORTEMENT RECOMMANDÉ de consulter un avocat spécialisé avant de continuer le projet.
      </p>
    </div>

    <div className="mt-6">
      <p className="text-gray-600 text-sm">
        Pour l'analyse complète détaillée, consultez le fichier <code className="bg-gray-100 px-2 py-1 rounded">ANALYSE_JURIDIQUE_COMPLETE.md</code> dans le dépôt.
      </p>
    </div>
  </div>
);

