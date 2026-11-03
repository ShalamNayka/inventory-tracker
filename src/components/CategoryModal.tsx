import Modal from './Modal';
import CategoryForm from './CategoryForm';
import type { CategoryFormData } from '../schemas/inventorySchemas';
import type { Category } from '../types/inventory';

type CategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  category?: Category;
  isSubmitting?: boolean;
};

function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  category,
  isSubmitting = false,
}: CategoryModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? `Edit ${category.name}` : 'Create Category'}
      maxWidth="520px"
    >
      <CategoryForm
        key={category?.id ?? 'new-category'}
        category={category}
        onSubmit={onSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
}

export default CategoryModal;