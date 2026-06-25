import React from 'react'
import './ExploreMenu.css'
import { shop_list } from '../../assets/assets'

const ExploreMenu = ({category, setCategory}) => {

  return (
    <div className='explore-menu' id='explore-menu'>
      <h1>Shop Fresh & Smoked Catfish</h1>
      <p className='explore-menu-text'>From our farm to your table, Elevoni delivers fresh and smoked catfish you can trust. Clean, tasty, and conveniently delivered—quality fish has never been this easy to get.</p>
      <div className='explore-menu-list'>
        {shop_list.map((item,index) =>{
            return (
                <div onClick={()=>setCategory(prev=>prev===item.category?"All":item.category)} key={index} className="explore-menu-list-item">
                    <img className={category===item.category?"active":""} src={item.product_image} alt="" />
                    <p>{item.product_name}</p>
                </div>
            )
        })}
      </div>
      <hr />
    </div>
  )
}

export default ExploreMenu
