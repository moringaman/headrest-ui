export default function FeedMappingPreview() {
  const mappings = [
    {
      prestashop: 'product_name',
      google: 'title',
      description: 'Product name from PrestaShop',
      required: true
    },
    {
      prestashop: 'description',
      google: 'description',
      description: 'Full product description',
      required: true
    },
    {
      prestashop: 'price (incl. tax)',
      google: 'price',
      description: 'Product price with currency',
      required: true
    },
    {
      prestashop: 'cover_image',
      google: 'image_link',
      description: 'Main product image URL',
      required: true
    },
    {
      prestashop: 'quantity > 0',
      google: 'availability',
      description: 'In stock / Out of stock',
      required: true
    },
    {
      prestashop: 'ean13 / upc',
      google: 'gtin',
      description: 'Global Trade Item Number',
      required: false
    },
    {
      prestashop: 'manufacturer',
      google: 'brand',
      description: 'Product brand name',
      required: false
    },
    {
      prestashop: 'category_path',
      google: 'product_type',
      description: 'Category hierarchy',
      required: false
    }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Field Mapping Preview</h3>
        <p className="text-sm text-gray-600 mt-1">
          How your PrestaShop data will be mapped to Google Shopping attributes
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PrestaShop Field
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">

              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Google Shopping
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Required
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mappings.map((mapping, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{mapping.prestashop}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <svg className="w-5 h-5 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{mapping.google}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">{mapping.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {mapping.required ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Optional
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-start space-x-2 text-sm text-gray-600">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            These mappings can be customized based on your PrestaShop data structure. Advanced plans include custom field templates and conditional mappings.
          </p>
        </div>
      </div>
    </div>
  )
}
