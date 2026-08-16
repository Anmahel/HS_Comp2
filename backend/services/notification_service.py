import urllib.parse
from datetime import datetime

def build_whatsapp_link(lote, custom_phone=None):
    """
    Generates a WhatsApp click-to-chat URL with pre-filled batch summary
    for sending to the printing operator or warehouse team.
    """
    created_str = lote.created_at.strftime('%d/%m/%Y %H:%M') if lote.created_at else datetime.now().strftime('%d/%m/%Y %H:%M')
    total_separacao = lote.total_descontado_pecas + lote.total_descontado_estampas

    msg = (
        f"📦 *HC_comp • Relatório de Pedidos - Lote #{lote.id}*\n"
        f"🗓️ *Data:* {created_str}\n"
        f"📁 *Arquivo:* {lote.nome_arquivo}\n"
        f"👤 *Responsável:* {lote.usuario_responsavel}\n\n"
        f"📊 *RESUMO DO LOTE:*\n"
        f"• Total de Itens: *{lote.total_itens} un*\n"
        f"• 📦 Separação Almoxarifado: *{total_separacao} un* ({lote.total_descontado_pecas} peças + {lote.total_descontado_estampas} estampas)\n"
        f"• 🖨️ Fila de Impressão (Gráfica): *{lote.total_necessita_impressao} un*\n\n"
        f"📄 Baixe os PDFs (Imprenta e Separação) diretamente pelo sistema HC_comp."
    )

    encoded_msg = urllib.parse.quote(msg)
    if custom_phone:
        clean_phone = "".join(filter(str.isdigit, str(custom_phone)))
        return f"https://api.whatsapp.com/send?phone={clean_phone}&text={encoded_msg}"
    return f"https://api.whatsapp.com/send?text={encoded_msg}"


def send_email_notification_hook(lote, recipient_email=None):
    """
    Notification hook for email integration (ready for SMTP or webhook).
    """
    return {
        'status': 'queued',
        'recipient': recipient_email or 'equipe@empresa.com',
        'lote_id': lote.id,
        'subject': f"HC_comp - Novo Lote #{lote.id} Processado ({lote.total_itens} itens)"
    }
