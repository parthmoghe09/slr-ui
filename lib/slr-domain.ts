export type Role = 'user' | 'admin' | 'master'
export type ViewKey = 'prediction' | 'what-if' | 'data' | 'model' | 'master'
export type EngineeringInputs = { outerDiameter: number; sectionWidth: number; nsd: number; treadWidth: number; treadDevelopment: number; shoulderDiameter: number; rimCode: number; rimWidth: number; rimHeight: number; plyEpi: number; plies: number; breakers: number; inflationPressure: number }
export type DerivedParameters = { unloadedRadius: number | null; odWidthRatio: number | null; shoulderDrop: number | null; treadWidthRatio: number | null; plyReinforcementIndex: number | null }
export type ShapContribution = { feature: string; value: number; direction: 'positive' | 'negative' }
export type PredictionResponse = { predictionId: string; predictedSlr: number; lower: number; upper: number; confidence: number; warning: string; shap: ShapContribution[]; derived: DerivedParameters; model: string; timestamp: string }
export type ModelMetric = { name: string; mape: number; r2: number; rmse: number; status: 'Champion' | 'Candidate' }
export const inputGroups = [
  { label: 'Geometry', fields: ['outerDiameter','sectionWidth','nsd','treadWidth','treadDevelopment','shoulderDiameter'] },
  { label: 'Rim', fields: ['rimCode','rimWidth','rimHeight'] },
  { label: 'Construction', fields: ['plyEpi','plies','breakers'] },
  { label: 'Inflation / design specification', fields: ['inflationPressure'] },
] as const
export const inputBounds: Record<keyof EngineeringInputs, { label: string; min: number; max: number; unit: string; placeholder: string; step?: number }> = {
  outerDiameter:{label:'Outer Diameter',min:400,max:2600,unit:'mm',placeholder:'e.g. 1100'}, sectionWidth:{label:'Section Width',min:150,max:900,unit:'mm',placeholder:'e.g. 315'}, nsd:{label:'NSD',min:5,max:100,unit:'mm',placeholder:'e.g. 22'}, treadWidth:{label:'Tread Width',min:100,max:900,unit:'mm',placeholder:'e.g. 275'}, treadDevelopment:{label:'Tread Development',min:100,max:4000,unit:'mm',placeholder:'e.g. 3350'}, shoulderDiameter:{label:'Shoulder Diameter',min:300,max:2500,unit:'mm',placeholder:'e.g. 1040'}, rimCode:{label:'Rim Code',min:8,max:60,unit:'in',placeholder:'e.g. 22'}, rimWidth:{label:'Rim Width',min:100,max:1000,unit:'mm',placeholder:'e.g. 250'}, rimHeight:{label:'Rim Height',min:100,max:1000,unit:'mm',placeholder:'e.g. 480'}, plyEpi:{label:'Ply EPI',min:5,max:100,unit:'EPI',placeholder:'e.g. 24'}, plies:{label:'Quantity of Plies',min:1,max:30,unit:'count',placeholder:'e.g. 8'}, breakers:{label:'Quantity of Breakers',min:0,max:12,unit:'count',placeholder:'e.g. 4'}, inflationPressure:{label:'Standard Inflation Pressure',min:10,max:150,unit:'PSI',placeholder:'e.g. 100'},
}
export const emptyInputs: EngineeringInputs = { outerDiameter:0,sectionWidth:0,nsd:0,treadWidth:0,treadDevelopment:0,shoulderDiameter:0,rimCode:0,rimWidth:0,rimHeight:0,plyEpi:0,plies:0,breakers:0,inflationPressure:0 }
export const metrics: ModelMetric[] = [{name:'Random Forest',mape:6.76,r2:.942,rmse:43.71,status:'Champion'},{name:'XGBoost',mape:7.18,r2:.935,rmse:46.28,status:'Candidate'},{name:'CatBoost',mape:7.42,r2:.928,rmse:48.06,status:'Candidate'}]
export const featureImportance = [{feature:'Shoulder Diameter',value:49.56},{feature:'Unloaded Radius',value:23.19},{feature:'Section Width',value:11.84},{feature:'Inflation Pressure',value:8.42},{feature:'Ply EPI',value:6.99}]
export const auditLogs = ['09:41:02  feature.validation  geometry bounds validated','09:41:04  data.registry      representative tyre dataset loaded','09:41:07  model.registry     random-forest-v2.4.1 selected','09:41:11  inference.service  prediction contract ready','09:41:15  explanation.engine feature-wise contributions emitted']
export function deriveInputs(i: EngineeringInputs): DerivedParameters { const has=(v:number)=>v>0; return {unloadedRadius:has(i.outerDiameter)&&has(i.nsd)?(i.outerDiameter-i.nsd)/2:null,odWidthRatio:has(i.outerDiameter)&&has(i.sectionWidth)?i.outerDiameter/i.sectionWidth:null,shoulderDrop:has(i.outerDiameter)&&has(i.shoulderDiameter)?(i.outerDiameter-i.shoulderDiameter)/2:null,treadWidthRatio:has(i.treadWidth)&&has(i.sectionWidth)?i.treadWidth/i.sectionWidth:null,plyReinforcementIndex:has(i.plyEpi)&&has(i.plies)?i.plyEpi*i.plies:null} }
export function isValid(i: EngineeringInputs) { return Object.entries(inputBounds).every(([key,b]) => { const value=i[key as keyof EngineeringInputs]; return value>=b.min&&value<=b.max }) }
export async function predict(inputs: EngineeringInputs): Promise<PredictionResponse> { const d=deriveInputs(inputs); const radius=d.unloadedRadius ?? 0; const slr=Number((radius*.72+(inputs.inflationPressure-80)*.16+(inputs.shoulderDiameter-900)*.04).toFixed(1)); return {predictionId:`SLR-${Date.now().toString(36).toUpperCase()}`,predictedSlr:slr,lower:Number((slr-43.7).toFixed(1)),upper:Number((slr+43.7).toFixed(1)),confidence:94.2,warning:inputs.inflationPressure>125?'Pressure is near the edge of the validated design envelope.':'Within representative validation envelope.',derived:d,model:'Random Forest · v2.4.1',timestamp:new Date().toISOString(),shap:[{feature:'Shoulder Diameter',value:Number(((inputs.shoulderDiameter-900)*.04).toFixed(1)),direction:inputs.shoulderDiameter>=900?'positive':'negative'},{feature:'Unloaded Radius',value:Number(((radius-400)*.06).toFixed(1)),direction:radius>=400?'positive':'negative'},{feature:'Inflation Pressure',value:Number(((inputs.inflationPressure-80)*.12).toFixed(1)),direction:inputs.inflationPressure>=80?'positive':'negative'},{feature:'Section Width',value:Number(((inputs.sectionWidth-315)*-.04).toFixed(1)),direction:inputs.sectionWidth<=315?'positive':'negative'},{feature:'Ply EPI',value:Number(((inputs.plyEpi-24)*-.5).toFixed(1)),direction:inputs.plyEpi<=24?'positive':'negative'}] } }
export const featureLabel=(key:string)=>inputBounds[key as keyof EngineeringInputs]?.label ?? key
export const navForRole=(role:Role): [ViewKey,string,string][] => role==='user' ? [['prediction','SLR Prediction','Activity'],['what-if','What-If Analysis','SlidersHorizontal']] : role==='admin' ? [['prediction','SLR Prediction','Activity'],['what-if','What-If Analysis','SlidersHorizontal'],['data','Data Versioning','Database'],['model','Model Versioning','BrainCircuit']] : [['prediction','SLR Prediction','Activity'],['what-if','What-If Analysis','SlidersHorizontal'],['data','Data Versioning','Database'],['model','Model Versioning','BrainCircuit'],['master','Master Dashboard','ShieldCheck']]
export const roleFromCredentials=(id:string,password:string):Role|null=>id==='master.ceat'&&password==='ceat-master'? 'master':id==='admin.ceat'&&password==='ceat-admin'?'admin':id==='engineer.ceat'&&password==='ceat-user'?'user':null
export const whatIfFeatures=['outerDiameter','sectionWidth','shoulderDiameter','inflationPressure','plyEpi'] as const
export const sensitivity=Array.from({length:9},(_,i)=>({od:800+i*75,slr:238+i*18.5}))
export const reportTypes=['Prediction summary','Feature analysis','Validation summary'] as const
export const drift=[{label:'Input coverage',value:'98.6%',status:'Healthy'},{label:'Prediction stability',value:'0.14 mm',status:'Healthy'},{label:'Model validation',value:'2.1% MAPE',status:'Review'}]
export type ReportType=typeof reportTypes[number]
export type ViewModel=ViewKey
export type DriftStatus=typeof drift[number]
export type DerivedField=keyof DerivedParameters
export type FeatureDefinition=keyof EngineeringInputs
export type ModelStatus=ModelMetric['status']
export type PredictionState=PredictionResponse|null
export type ValidationStatus='Healthy'|'Review'
export type DataGroup=typeof inputGroups[number]['label']
export type FeatureValue=number
export type ServiceResponse<T>=Promise<T>
export type PredictionRequest={inputs:EngineeringInputs}
export const predictionEndpoint='/api/v1/predict'
export const chartData=metrics.map(m=>({name:m.name.replace('Random Forest','RF').replace('XGBoost','XGB').replace('CatBoost','CB'),mape:m.mape,r2:m.r2*100}))
export const modelCriteria=['Generalization across validation groups','MAPE below 8.0% threshold','No overlapping groups','Prediction interval available']
export const defaultInputs=emptyInputs
export const navItems=navForRole('master')
export const deriveFeatureFormula=(key:DerivedField)=>({unloadedRadius:'(Outer Diameter − NSD) / 2',odWidthRatio:'Outer Diameter / Section Width',shoulderDrop:'(Outer Diameter − Shoulder Diameter) / 2',treadWidthRatio:'Tread Width / Section Width',plyReinforcementIndex:'Ply EPI × Quantity of Plies'})[key]
export const formatNumber=(value:number|null, digits=1)=>value===null?'—':value.toFixed(digits)
export const emptyPrediction:PredictionState=null
export const apiContract={method:'POST',path:predictionEndpoint,response:'PredictionResponse'} as const
export const inputKeys=Object.keys(inputBounds) as (keyof EngineeringInputs)[]
export const mockDataset={name:'CEAT representative tyre geometry',version:'dataset-2026.09',groups:91}
export const mockUserRoles:Record<Role,string>={user:'Engineer',admin:'Data Administrator',master:'Platform Administrator'}
export const confidenceLabel=(confidence:number)=>confidence>=90?'High':confidence>=75?'Moderate':'Review'
export const validationGroups={train:72,test:19,overlap:0}
export const modelHyperparameters={RandomForest:{trees:500,maxDepth:18,minSamplesLeaf:2},XGBoost:{estimators:600,learningRate:.035,maxDepth:7},CatBoost:{iterations:800,depth:8,loss:'RMSE'}}
export const featureGovernance=['Units standardized','Target leakage screened','Group split enforced','Source lineage recorded']
export const systemFlows=['Engineering inputs','Feature engineering','SLR prediction','Confidence interval','Feature-wise contribution','What-if analysis','Engineering report']
export const availableRoles:Role[]=['user','admin','master']
export const canManageFeatures=(role:Role)=>role!=='user'
export const canAccessMaster=(role:Role)=>role==='master'
export const isNumericInput=(value:string)=>/^\d*$/.test(value)
export const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value))
export const formatDate=(iso:string)=>new Date(iso).toLocaleString()
export const version='v2.4.1'
export const productName='CEAT SLR Simulator'
export const productSubtitle='AI-Driven Static Loaded Radius Prediction'
export const brand={blue:'#123B68',orange:'#EA580C'}
export const statusColor=(status:string)=>status==='Healthy'?'text-primary':'text-accent'
export const statusSurface=(status:string)=>status==='Healthy'?'bg-primary/10':'bg-accent/10'
export const appDescription='Engineering decision support for tyre static loaded radius prediction.'
export const demoCredentials='engineer.ceat / ceat-user · admin.ceat / ceat-admin · master.ceat / ceat-master'
export const adminFeatures=['Add independent feature','Add derived feature','Inspect feature metadata']
export const roleLabel=(role:Role)=>mockUserRoles[role]
export const resultUnits='mm'
export const confidenceRange=(slr:number)=>({lower:slr-43.7,upper:slr+43.7})
export const predictionStatus='Representative prototype data'
export const excludedInputs=['Deflection','Deflection test pressure','Load %','Test pressure','Force','Radial stiffness','SLR']
export const engineeringGroups=inputGroups.map(group=>group.label)
export const allViews:ViewKey[]=['prediction','what-if','data','model','master']
export const appShell='persistent-sidebar'
export const animation={duration:.18,ease:'easeInOut'} as const
export const inputFeatureCount=inputKeys.length
export const targetName='Static Loaded Radius'
export const reportMetadata=['inputs','derived features','prediction','confidence','contributions','model/version','timestamp','prediction identifier'] as const
export const dataVersion='representative-2026.09'
export const modelVersion=version
export const defaultConfidence=94.2
export const emptyDerived:DerivedParameters={unloadedRadius:null,odWidthRatio:null,shoulderDrop:null,treadWidthRatio:null,plyReinforcementIndex:null}
export const contributionTitle='Feature-wise Contribution'
export const uncertaintyTitle='Prediction interval'
export const primaryAction='PREDICT SLR'
export const resetAction='Reset to Baseline'
export const productRoute='/'
export const reportAction='Generate Report'
export const roleVisibility='role-aware navigation'
export const noGreenPolicy=true
export const replacementBoundary=0.15
export const domainVersion='1.0'
export const futureService={predict:predictionEndpoint}
export const sampleDataNotice='Representative sample data — replaceable through the future API contract.'
export const appIdentity={name:productName,subtitle:productSubtitle}
export const featureTypes=['number','derived'] as const
export const statusLabels=['Healthy','Review'] as const
export const maxTopN=5
export const minTopN=3
export const defaultTopN=5
export const baselineChange=(baseline:number,change:number)=>baseline*(1+change/100)
export const safeRatio=(a:number,b:number)=>b? a/b:null
export const serviceName='SLR prediction service'
export const authTitle=productName
export const authSubtitle=productSubtitle
export const validRoleNames=['User','Admin','Master Admin'] as const
export const featureSource='CEAT representative engineering dataset'
export const defaultReportType=reportTypes[0]
export const statusLegend='Blue indicates healthy operational state; orange indicates review.'
export const engineeringPalette={blue:'#123B68',orange:'#EA580C',surface:'#F8FAFC'}
export const chartPalette={blue:'#123B68',orange:'#EA580C',muted:'#94A3B8'}
export const auditStatus='Audit trail available'
export const schemaName='PredictionRequest'
export const responseSchemaName='PredictionResponse'
export const endpointMethod='POST'
export const endpointPath='/api/v1/predict'
export const currentYear=2026
export const uiMode='engineering'
export const futureAuth='enterprise authentication'
export const targetLeakagePolicy='excluded from prediction inputs'
export const reportPreview='print-ready frontend preview'
export const appShellOrientation='sidebar-left'
export const colorPolicy='CEAT blue and orange; no green'
export const dynamicFeaturePolicy='metadata-driven'
export const whatIfPolicy='baseline sourced from prediction inputs'
export const initialPredictionPolicy='blank until valid submission'
export const applicationType='engineering decision support'
export const adminPolicy='progressive privilege visibility'
export const loadingDuration=800
export const defaultModel=metrics[0].name
export const defaultDataset=mockDataset.name
export const datasetGroups=mockDataset.groups
export const predictionTarget='SLR'
export const contributionEngine='SHAP-compatible feature-wise explanation'
export const architectureReady=true
export const endOfDomain=true
