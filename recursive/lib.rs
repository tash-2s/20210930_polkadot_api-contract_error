#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[derive(Debug, Clone, scale::Encode, scale::Decode, ink_storage::traits::PackedLayout)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink_storage::traits::StorageLayout)
)]
pub enum MyEnum {
    A,
    B(ink_prelude::boxed::Box<MyEnum>),
}

impl ink_storage::traits::SpreadLayout for MyEnum {
    const FOOTPRINT: u64 = 1;
    fn pull_spread(_ptr: &mut ink_storage::traits::KeyPtr) -> Self {
        unimplemented!();
    }
    fn push_spread(&self, _ptr: &mut ink_storage::traits::KeyPtr) {
        unimplemented!();
    }
    fn clear_spread(&self, _ptr: &mut ink_storage::traits::KeyPtr) {
        unimplemented!();
    }
}

#[ink::contract]
mod recursive {
    use super::MyEnum;
    use ink_storage::Pack;

    #[ink(storage)]
    pub struct Recursive {
        value: Pack<MyEnum>,
    }

    impl Recursive {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                value: Pack::new(MyEnum::A),
            }
        }

        #[ink(message)]
        pub fn get(&self) -> MyEnum {
            (*self.value).clone()
        }

        #[ink(message)]
        pub fn set(&mut self, new: MyEnum) {
            *self.value = new;
        }
    }
}
