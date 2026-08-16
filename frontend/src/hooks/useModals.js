import { useState } from 'react';

export function useModals() {
  // Form Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formCategory, setFormCategory] = useState('peca'); // 'peca' | 'estampa'
  const [itemToEdit, setItemToEdit] = useState(null);

  // Deduct Modal state
  const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);
  const [itemToDeduct, setItemToDeduct] = useState(null);
  const [deductCategory, setDeductCategory] = useState('peca');

  // Cancel Lote Modal state
  const [isCancelLoteModalOpen, setIsCancelLoteModalOpen] = useState(false);
  const [loteToCancel, setLoteToCancel] = useState(null);

  const openCreateModal = (category = 'peca') => {
    setFormCategory(category);
    setItemToEdit(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (item, category = 'peca') => {
    setFormCategory(category);
    setItemToEdit(item);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setItemToEdit(null);
  };

  const openDeductModal = (item, category = 'peca') => {
    setItemToDeduct(item);
    setDeductCategory(category);
    setIsDeductModalOpen(true);
  };

  const closeDeductModal = () => {
    setIsDeductModalOpen(false);
    setItemToDeduct(null);
  };

  const openCancelLoteModal = (lote) => {
    setLoteToCancel(lote);
    setIsCancelLoteModalOpen(true);
  };

  const closeCancelLoteModal = () => {
    setLoteToCancel(null);
    setIsCancelLoteModalOpen(false);
  };

  return {
    // Form Modal
    isFormModalOpen,
    formCategory,
    itemToEdit,
    openCreateModal,
    openEditModal,
    closeFormModal,
    // Deduct Modal
    isDeductModalOpen,
    itemToDeduct,
    deductCategory,
    openDeductModal,
    closeDeductModal,
    // Cancel Modal
    isCancelLoteModalOpen,
    loteToCancel,
    openCancelLoteModal,
    closeCancelLoteModal,
  };
}
