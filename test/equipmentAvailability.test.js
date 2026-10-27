// ============================================
// TEST: EQUIPMENT AVAILABILITY LOGIC
// Unit tests verifying the difference in availability
// models between Books (quantity-based) and Equipment
// (status-based).
// ============================================

const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Catalog Availability Logic - Books vs Equipment', () => {
  // Logic from ItemCard.jsx and CatalogPage.jsx
  function checkItemAvailability(item) {
    if (item.type === 'equipment') {
      return item.status === 'available';
    }
    // Books: use availableQuantity or fallback to quantity > 0
    return (item.availableQuantity ?? item.quantity ?? 0) > 0;
  }

  function getItemBadgeInfo(item) {
    const isEquip = item.type === 'equipment';
    const isAvailable = checkItemAvailability(item);

    if (isEquip) {
      if (item.status === 'available') return { text: 'Available for Booking', variant: 'success' };
      if (item.status === 'maintenance') return { text: 'Under Maintenance', variant: 'warning' };
      return { text: 'In Use', variant: 'neutral' };
    }

    if (isAvailable) {
      const qty = item.availableQuantity ?? item.quantity;
      return { text: `${qty} In Stock`, variant: 'success' };
    }
    return { text: 'Out of Stock', variant: 'danger' };
  }

  it('should mark equipment with status "available" as available regardless of quantity property', () => {
    const microscope = {
      id: 'eq-1',
      title: 'Digital Microscope 4K',
      type: 'equipment',
      status: 'available',
      // No quantity or availableQuantity field provided!
    };

    assert.strictEqual(checkItemAvailability(microscope), true);
    const badge = getItemBadgeInfo(microscope);
    assert.strictEqual(badge.text, 'Available for Booking');
    assert.strictEqual(badge.variant, 'success');
  });

  it('should mark equipment with status "maintenance" as unavailable', () => {
    const spectrometer = {
      id: 'eq-2',
      title: 'Mass Spectrometer',
      type: 'equipment',
      status: 'maintenance',
    };

    assert.strictEqual(checkItemAvailability(spectrometer), false);
    const badge = getItemBadgeInfo(spectrometer);
    assert.strictEqual(badge.text, 'Under Maintenance');
    assert.strictEqual(badge.variant, 'warning');
  });

  it('should mark equipment with status "borrowed" as unavailable', () => {
    const oscilloscope = {
      id: 'eq-3',
      title: 'Digital Oscilloscope',
      type: 'equipment',
      status: 'borrowed',
    };

    assert.strictEqual(checkItemAvailability(oscilloscope), false);
    const badge = getItemBadgeInfo(oscilloscope);
    assert.strictEqual(badge.text, 'In Use');
    assert.strictEqual(badge.variant, 'neutral');
  });

  it('should mark book with availableQuantity > 0 as available', () => {
    const book = {
      id: 'bk-1',
      title: 'Clean Code',
      type: 'book',
      quantity: 5,
      availableQuantity: 3,
    };

    assert.strictEqual(checkItemAvailability(book), true);
    const badge = getItemBadgeInfo(book);
    assert.strictEqual(badge.text, '3 In Stock');
    assert.strictEqual(badge.variant, 'success');
  });

  it('should mark book with 0 availableQuantity as Out of Stock', () => {
    const book = {
      id: 'bk-2',
      title: 'Design Patterns',
      type: 'book',
      quantity: 3,
      availableQuantity: 0,
    };

    assert.strictEqual(checkItemAvailability(book), false);
    const badge = getItemBadgeInfo(book);
    assert.strictEqual(badge.text, 'Out of Stock');
    assert.strictEqual(badge.variant, 'danger');
  });
});
