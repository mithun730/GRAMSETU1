import React, { useState, useEffect } from 'react';
import { Building, Save, RefreshCw, AlertCircle, CheckCircle2, Phone, Mail, MapPin, Users } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import { usePanchayat } from '../../context/PanchayatContext';
import { logAuditEvent } from '../../lib/audit';

export const PanchayatAdminTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { panchayat, refreshData } = usePanchayat();

  const [name, setName] = useState(panchayat.name);
  const [nameTe, setNameTe] = useState(panchayat.name_te || '');
  const [district, setDistrict] = useState(panchayat.district);
  const [mandal, setMandal] = useState(panchayat.mandal);
  const [state, setState] = useState(panchayat.state);
  const [pincode, setPincode] = useState(panchayat.pincode);
  const [lgdCode, setLgdCode] = useState(panchayat.lgd_code || '');
  const [population, setPopulation] = useState(String(panchayat.population || 4250));
  const [totalWards, setTotalWards] = useState(String(panchayat.total_wards || 12));
  const [sarpanchName, setSarpanchName] = useState(panchayat.sarpanch_name || '');
  const [sarpanchPhone, setSarpanchPhone] = useState(panchayat.sarpanch_phone || '');
  const [secretaryName, setSecretaryName] = useState(panchayat.secretary_name || '');
  const [secretaryPhone, setSecretaryPhone] = useState(panchayat.secretary_phone || '');
  const [officeAddress, setOfficeAddress] = useState(panchayat.office_address || '');
  const [contactEmail, setContactEmail] = useState(panchayat.contact_email || '');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setName(panchayat.name);
    setNameTe(panchayat.name_te || '');
    setDistrict(panchayat.district);
    setMandal(panchayat.mandal);
    setState(panchayat.state);
    setPincode(panchayat.pincode);
    setLgdCode(panchayat.lgd_code || '');
    setPopulation(String(panchayat.population || 4250));
    setTotalWards(String(panchayat.total_wards || 12));
    setSarpanchName(panchayat.sarpanch_name || '');
    setSarpanchPhone(panchayat.sarpanch_phone || '');
    setSecretaryName(panchayat.secretary_name || '');
    setSecretaryPhone(panchayat.secretary_phone || '');
    setOfficeAddress(panchayat.office_address || '');
    setContactEmail(panchayat.contact_email || '');
  }, [panchayat]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg('Supabase is not configured.');
      setSubmitting(false);
      return;
    }

    const payload = {
      name: name.trim(),
      name_te: nameTe.trim() || null,
      district: district.trim(),
      mandal: mandal.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      lgd_code: lgdCode.trim() || null,
      population: Number(population) || 0,
      total_wards: Number(totalWards) || 12,
      sarpanch_name: sarpanchName.trim() || null,
      sarpanch_phone: sarpanchPhone.trim() || null,
      secretary_name: secretaryName.trim() || null,
      secretary_phone: secretaryPhone.trim() || null,
      office_address: officeAddress.trim() || null,
      contact_email: contactEmail.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('panchayats')
        .update(payload)
        .eq('id', panchayat.id);

      if (error) throw error;

      logAuditEvent({
        panchayatId: panchayat.id,
        action: 'UPDATE_PANCHAYAT_CONFIG',
        entityType: 'panchayats',
        entityId: panchayat.id,
        newData: payload,
      });

      setSuccessMsg('Gram Panchayat details updated successfully in Supabase!');
      refreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update panchayat details');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>Gram Panchayat Master Configuration</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {language === 'te' ? 'పంచాయతీ వివరాల కాన్ఫిగరేషన్' : 'Panchayat Entity Settings & Contacts'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Update official Panchayat names (English/Telugu), LGD Code, Ward count, Sarpanch and Secretary details stored in the `panchayats` table.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6 text-xs">
        
        <div className="border-b border-slate-100 pb-5">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide mb-3">
            1. Official Nomenclature & Jurisdiction
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Panchayat Name (English) *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 font-semibold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Panchayat Name (Telugu)</label>
              <input
                type="text"
                value={nameTe}
                onChange={(e) => setNameTe(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Mandal *</label>
              <input
                type="text"
                value={mandal}
                onChange={(e) => setMandal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">District *</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">State *</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Local Government Directory (LGD) Code</label>
              <input
                type="text"
                value={lgdCode}
                onChange={(e) => setLgdCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 font-mono text-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 pb-5">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide mb-3">
            2. Demographics & Wards
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Total Wards</label>
              <input
                type="number"
                value={totalWards}
                onChange={(e) => setTotalWards(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Village Population</label>
              <input
                type="number"
                value={population}
                onChange={(e) => setPopulation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Postal Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 pb-5">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide mb-3">
            3. Elected Representatives & Administration Contacts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Sarpanch Full Name</label>
              <input
                type="text"
                value={sarpanchName}
                onChange={(e) => setSarpanchName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Sarpanch Contact Phone</label>
              <input
                type="text"
                value={sarpanchPhone}
                onChange={(e) => setSarpanchPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Panchayat Secretary Name</label>
              <input
                type="text"
                value={secretaryName}
                onChange={(e) => setSecretaryName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Panchayat Secretary Contact Phone</label>
              <input
                type="text"
                value={secretaryPhone}
                onChange={(e) => setSecretaryPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide mb-3">
            4. Gram Panchayat Office Address & Email
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Official Office Address</label>
              <textarea
                value={officeAddress}
                onChange={(e) => setOfficeAddress(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
              ></textarea>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Official Panchayat Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 text-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 text-xs"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving to Supabase...' : 'Save Panchayat Configuration'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
