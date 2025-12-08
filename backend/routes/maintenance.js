const express = require('express');
const router = express.Router();

/**
 * Maintenance endpoint to apply database changes
 * This endpoint can be called to update learning content without shell access
 */
router.post('/apply-content-changes', async (req, res) => {
  try {
    console.log('='.repeat(80));
    console.log('Maintenance endpoint triggered: Applying content changes...');
    console.log('='.repeat(80));
    
    const { applyAllChanges } = require('../scripts/apply-all-changes-railway');
    
    // Run the script
    await applyAllChanges();
    
    console.log('✅ Content changes applied successfully via API');
    console.log('='.repeat(80));
    
    res.json({ 
      success: true, 
      message: 'Content changes applied successfully',
      timestamp: new Date().toISOString(),
      changes: [
        'Removed references from Introduction page',
        'Split Key Concepts into 8 separate pages (one concept per page)'
      ]
    });
  } catch (error) {
    console.error('❌ Failed to apply content changes:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to apply content changes',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

