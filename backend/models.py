from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, ForeignKey, CheckConstraint,
    UniqueConstraint, Index, func
)
from sqlalchemy.orm import relationship
from database import Base

class Brand(Base):
    __tablename__ = 'brands'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    slug = Column(String(50), nullable=False, unique=True)
    domain = Column(String(255), nullable=True)

    pecas_prontas = relationship('PecaPronta', back_populates='brand', cascade='all, delete-orphan')
    estampas = relationship('Estampa', back_populates='brand', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'domain': self.domain
        }

class Cor(Base):
    __tablename__ = 'cores'

    id = Column(Integer, primary_key=True, autoincrement=True)
    cor = Column(String(10), nullable=False, unique=True) # PRE, BRA, AMA, etc.
    nome = Column(String(50), nullable=True)

    pecas_prontas = relationship('PecaPronta', back_populates='cor')
    estampas = relationship('Estampa', back_populates='cor')

    def to_dict(self):
        return {
            'id': self.id,
            'cor': self.cor,
            'nome': self.nome or self.cor
        }

class Design(Base):
    __tablename__ = 'designs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome_design = Column(String(50), nullable=False)
    codigo_estampa = Column(String(10), nullable=False) # e.g. "001", "002"

    pecas_prontas = relationship('PecaPronta', back_populates='design')
    estampas = relationship('Estampa', back_populates='design')

    @property
    def Cod_Estampa(self):
        return self.codigo_estampa

    @Cod_Estampa.setter
    def Cod_Estampa(self, value):
        self.codigo_estampa = value

    def to_dict(self):
        return {
            'id': self.id,
            'nome_design': self.nome_design,
            'codigo_estampa': self.codigo_estampa,
            'Cod_Estampa': self.codigo_estampa
        }

class SKU(Base):
    __tablename__ = 'skus'

    id = Column(Integer, primary_key=True, autoincrement=True)
    sku = Column(String(50), nullable=False, unique=True, index=True)

    pecas_prontas = relationship('PecaPronta', back_populates='sku')
    estampas = relationship('Estampa', back_populates='sku')

    def to_dict(self):
        return {
            'id': self.id,
            'sku': self.sku
        }

class Tamanho(Base):
    __tablename__ = 'tamanhos'

    id = Column(Integer, primary_key=True, autoincrement=True)
    tamanho = Column(String(5), nullable=False, unique=True) # P, M, G, GG, G1, G2, G3, G4

    pecas_prontas = relationship('PecaPronta', back_populates='tamanho')

    def to_dict(self):
        return {
            'id': self.id,
            'tamanho': self.tamanho
        }

class Tipo(Base):
    __tablename__ = 'tipos'

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo = Column(String(10), nullable=False, unique=True) # CM, CF, MO
    nome = Column(String(50), nullable=False) # Camiseta Masculina, Camiseta Feminina, Moletom

    pecas_prontas = relationship('PecaPronta', back_populates='tipo')

    def to_dict(self):
        return {
            'id': self.id,
            'codigo': self.codigo,
            'nome': self.nome
        }

class PecaPronta(Base):
    __tablename__ = 'pecas_prontas'

    id = Column(Integer, primary_key=True, autoincrement=True)
    sku_id = Column(Integer, ForeignKey('skus.id'), nullable=True)
    tipo_id = Column(Integer, ForeignKey('tipos.id'), nullable=False)
    design_id = Column(Integer, ForeignKey('designs.id'), nullable=False)
    cor_id = Column(Integer, ForeignKey('cores.id'), nullable=False)
    tamanho_id = Column(Integer, ForeignKey('tamanhos.id'), nullable=False)
    brand_id = Column(Integer, ForeignKey('brands.id'), nullable=False)
    quantidade = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint('quantidade >= 0', name='check_quantidade_peca_positiva'),
    )

    sku = relationship('SKU', back_populates='pecas_prontas')
    tipo = relationship('Tipo', back_populates='pecas_prontas')
    design = relationship('Design', back_populates='pecas_prontas')
    cor = relationship('Cor', back_populates='pecas_prontas')
    tamanho = relationship('Tamanho', back_populates='pecas_prontas')
    brand = relationship('Brand', back_populates='pecas_prontas')

    @property
    def codigo_estampa(self):
        return self.design.codigo_estampa if self.design else None

    @codigo_estampa.setter
    def codigo_estampa(self, value):
        if self.design:
            self.design.codigo_estampa = value

    def to_dict(self):
        sku_str = self.sku.sku if self.sku else None
        cor_code = self.cor.cor if self.cor else None
        cor_name = self.cor.nome if self.cor else cor_code
        brand_slug = self.brand.slug if self.brand else None
        brand_name = self.brand.name if self.brand else None
        tipo_code = self.tipo.codigo if self.tipo else None
        tipo_name = self.tipo.nome if self.tipo else None
        design_code = self.design.codigo_estampa if self.design else None
        design_name = self.design.nome_design if self.design else None
        tam_code = self.tamanho.tamanho if self.tamanho else None

        if not sku_str and brand_slug and tipo_code and design_code and cor_code and tam_code:
            sku_str = f"{brand_slug}-{tipo_code}-{design_code}-{cor_code}-{tam_code}"

        return {
            'id': self.id,
            'sku_id': self.sku_id,
            'sku': sku_str,
            'tipo_id': self.tipo_id,
            'tipo_codigo': tipo_code,
            'tipo_nome': tipo_name,
            'design_id': self.design_id,
            'nome_design': design_name,
            'codigo_estampa': design_code,
            'cor_id': self.cor_id,
            'cor': cor_code,
            'cor_nome': cor_name,
            'tamanho_id': self.tamanho_id,
            'tamanho': tam_code,
            'brand_id': self.brand_id,
            'brand_name': brand_name,
            'brand_slug': brand_slug,
            'quantidade': self.quantidade,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Estampa(Base):
    __tablename__ = 'estampas'

    id = Column(Integer, primary_key=True, autoincrement=True)
    codigo_estampa = Column(String(10), nullable=True) # Direct code or populated from design
    design_id = Column(Integer, ForeignKey('designs.id'), nullable=False)
    cor_id = Column(Integer, ForeignKey('cores.id'), nullable=False)
    brand_id = Column(Integer, ForeignKey('brands.id'), nullable=False)
    sku_id = Column(Integer, ForeignKey('skus.id'), nullable=True)
    quantidade = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint('quantidade >= 0', name='check_quantidade_estampa_positiva'),
    )

    design = relationship('Design', back_populates='estampas')
    cor = relationship('Cor', back_populates='estampas')
    brand = relationship('Brand', back_populates='estampas')
    sku = relationship('SKU', back_populates='estampas')

    def to_dict(self):
        cod = self.codigo_estampa or (self.design.codigo_estampa if self.design else None)
        sku_str = self.sku.sku if self.sku else None
        cor_code = self.cor.cor if self.cor else None
        cor_name = self.cor.nome if self.cor else cor_code
        brand_slug = self.brand.slug if self.brand else None
        brand_name = self.brand.name if self.brand else None
        design_name = self.design.nome_design if self.design else None

        if not sku_str and brand_slug and cor_code and cod:
            sku_str = f"{brand_slug}-EST-{cod}-{cor_code}"

        return {
            'id': self.id,
            'codigo_estampa': cod,
            'design_id': self.design_id,
            'nome_design': design_name,
            'cor_id': self.cor_id,
            'cor': cor_code,
            'cor_nome': cor_name,
            'brand_id': self.brand_id,
            'brand_name': brand_name,
            'brand_slug': brand_slug,
            'sku_id': self.sku_id,
            'sku': sku_str,
            'quantidade': self.quantidade,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class MovimentacaoEstoque(Base):
    __tablename__ = 'movimentacoes_estoque'

    id = Column(Integer, primary_key=True, autoincrement=True)
    categoria = Column(String(20), nullable=False) # 'peca' | 'estampa'
    item_id = Column(Integer, nullable=False)
    tipo_movimento = Column(String(20), nullable=False) # 'ENTRADA' | 'SAIDA' | 'AJUSTE'
    quantidade = Column(Integer, nullable=False)
    quantidade_anterior = Column(Integer, nullable=False, default=0)
    quantidade_nova = Column(Integer, nullable=False, default=0)
    data_hora = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    observacao = Column(String(255), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'categoria': self.categoria,
            'item_id': self.item_id,
            'tipo_movimento': self.tipo_movimento,
            'quantidade': self.quantidade,
            'quantidade_anterior': self.quantidade_anterior,
            'quantidade_nova': self.quantidade_nova,
            'data_hora': self.data_hora.isoformat() if self.data_hora else None,
            'observacao': self.observacao
        }

class LotePedido(Base):
    __tablename__ = 'lotes_pedidos'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome_arquivo = Column(String(255), nullable=False)
    formato_origem = Column(String(50), nullable=False, default='CSV')
    status = Column(String(50), nullable=False, default='PROCESSADO') # 'PROCESSADO' | 'CANCELADO'
    total_itens = Column(Integer, nullable=False, default=0)
    total_descontado_pecas = Column(Integer, nullable=False, default=0)
    total_descontado_estampas = Column(Integer, nullable=False, default=0)
    total_necessita_impressao = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    motivo_cancelamento = Column(String(500), nullable=True)
    usuario_responsavel = Column(String(100), default='Soporte / Agatha')

    itens = relationship('ItemPedido', back_populates='lote', cascade='all, delete-orphan', lazy='joined')

    def to_dict(self, include_items=False):
        res = {
            'id': self.id,
            'nome_arquivo': self.nome_arquivo,
            'formato_origem': self.formato_origem,
            'status': self.status,
            'total_itens': self.total_itens,
            'total_descontado_pecas': self.total_descontado_pecas,
            'total_descontado_estampas': self.total_descontado_estampas,
            'total_necessita_impressao': self.total_necessita_impressao,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_deleted': self.is_deleted,
            'deleted_at': self.deleted_at.isoformat() if self.deleted_at else None,
            'motivo_cancelamento': self.motivo_cancelamento,
            'usuario_responsavel': self.usuario_responsavel
        }
        if include_items and self.itens:
            res['itens'] = [item.to_dict() for item in self.itens]
        return res

class ItemPedido(Base):
    __tablename__ = 'itens_pedidos'

    id = Column(Integer, primary_key=True, autoincrement=True)
    lote_id = Column(Integer, ForeignKey('lotes_pedidos.id', ondelete='CASCADE'), nullable=False)
    sku_original = Column(String(100), nullable=False)
    produto_nome = Column(String(255), nullable=True)
    quantidade_solicitada = Column(Integer, nullable=False, default=1)
    quantidade_descontada_peca = Column(Integer, nullable=False, default=0)
    quantidade_descontada_estampa = Column(Integer, nullable=False, default=0)
    quantidade_necessita_impressao = Column(Integer, nullable=False, default=0)
    data_pedido = Column(String(50), nullable=True)
    imagem_url = Column(String(500), nullable=True)
    tipo_item = Column(String(20), default='peca') # 'peca' | 'estampa'

    brand_id = Column(Integer, ForeignKey('brands.id'), nullable=True)
    design_id = Column(Integer, ForeignKey('designs.id'), nullable=True)
    cor_id = Column(Integer, ForeignKey('cores.id'), nullable=True)
    tipo_id = Column(Integer, ForeignKey('tipos.id'), nullable=True)
    tamanho_id = Column(Integer, ForeignKey('tamanhos.id'), nullable=True)
    peca_pronta_id = Column(Integer, ForeignKey('pecas_prontas.id'), nullable=True)
    estampa_id = Column(Integer, ForeignKey('estampas.id'), nullable=True)

    lote = relationship('LotePedido', back_populates='itens')
    brand = relationship('Brand')
    design = relationship('Design')
    cor = relationship('Cor')
    tipo = relationship('Tipo')
    tamanho = relationship('Tamanho')

    def to_dict(self):
        return {
            'id': self.id,
            'lote_id': self.lote_id,
            'sku_original': self.sku_original,
            'produto_nome': self.produto_nome,
            'quantidade_solicitada': self.quantidade_solicitada,
            'quantidade_descontada_peca': self.quantidade_descontada_peca,
            'quantidade_descontada_estampa': self.quantidade_descontada_estampa,
            'quantidade_necessita_impressao': self.quantidade_necessita_impressao,
            'data_pedido': self.data_pedido,
            'imagem_url': self.imagem_url,
            'tipo_item': self.tipo_item,
            'brand_id': self.brand_id,
            'brand_name': self.brand.name if self.brand else None,
            'brand_slug': self.brand.slug if self.brand else None,
            'design_id': self.design_id,
            'nome_design': self.design.nome_design if self.design else None,
            'codigo_estampa': self.design.codigo_estampa if self.design else None,
            'cor_id': self.cor_id,
            'cor': self.cor.cor if self.cor else None,
            'tipo_id': self.tipo_id,
            'tipo_codigo': self.tipo.codigo if self.tipo else None,
            'tamanho_id': self.tamanho_id,
            'tamanho': self.tamanho.tamanho if self.tamanho else None,
            'peca_pronta_id': self.peca_pronta_id,
            'estampa_id': self.estampa_id
        }

