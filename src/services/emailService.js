import { supabase } from './supabase'; 
const APP_URL = window.location.origin; 

export async function sendInviteEmail({to, inviterName, companyName, role}) { 
  const pw = Math.random().toString(36).slice(-12)+'Aa1!'; 
  console.log('🔍 Tentando criar usuário:', to);
  const {data, error} = await supabase.auth.signUp({
    email:to, 
    password:pw, 
    options:{
      data:{company_name:companyName,role,invited_by:inviterName},
      emailRedirectTo: `${APP_URL}/login`
    }
  }); 
  if(error) {
    console.error('❌ Erro detalhado do signUp:', error);
    console.error('❌ Status:', error.status);
    console.error('❌ Message:', error.message);
    throw error;
  }
  console.log('✅ SignUp bem-sucedido:', data);
  return {success:true, message:'Convite enviado!'}; 
}export function getEmailConfig() {return {configured:true};}
export async function testEmailConfiguration(testEmail) {return await sendInviteEmail({to:testEmail,inviterName:'Teste',companyName:'BG2',role:'user'});} 
