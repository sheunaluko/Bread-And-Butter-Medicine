export var ACS = {
    "ID" : "ACS" , 
    "description" : "Initial evaluation of suspected ACS"    ,
    "symptoms" : [ "chest pain" , "nausea" , "dyspnea"   ] ,
    "risk factors" : [ "old age", "diabetes", "dyslipidemia", "cigarette smoking", "hypertension", "cocaine abuse" ] ,
    "labs" : ["troponin" , "bnp" ] ,
    "procedures" : [ { "name" : "ekg" , "notes" : "If the initial EKG is normal, it should be repeated at 30 minute intervals while the patient remains symptomatic and suspicion for ACS remains" } , "telemetry" ] ,
    "interventions" : [{ "name" : "supplemental oxygen" , "goal" : "oxygen saturation > 90%" }] ,
    "medications" : [
	{"name" : "aspirin" ,
	 "dose" : "325mg" ,
	 "frequency" : "once" ,
	 "info" : "The only real contraindication is history of anaphylaxis"
	} ,
	{"name" : "nitroglycerin" ,
	 "form" : "tablet" , 
	 "dose" : ["0.3mg", "0.4mg"],
	 "frequency" : "every 5 minutes" ,
	 "contraindications" : ["aortic stenosis", "hypertrophic cardiomyopathy", "right ventricular infarct", "hypotension", "bradycardia", "tachycardia", "phosphodiesterase 5 inhibitor use" ],
	 "info" : [ "Nitrates are contraindicated when inferior myocardial infarction is suspected, with possible invovlement of the right ventricle, since these patients are preload dependent and nitrates can cause severe hypotension" , "Nitrates are contraindicated when PDE5 inhibitors have been used with 24 (sildenafil,vardenafil) or 36 (tadalafil) hours", "Response of pain to nitroglycerin administration is NOT diagnostic for ACS" ] 	 
	},
	{
	    "name" : "morphine" ,
	    "form" : "intravenous" ,
	    "dose" : "2mg|4mg" ,
	    "info" : "Can be used for refractory pain however may worsen outcomes"  
	}
    ], 
    "differential" : [ "aortic dissection" , "pulmonary embolism", "esophageal rupture" ,"perforating peptic ulcer", "tension pneumothorax" ] 
    ]

} 
